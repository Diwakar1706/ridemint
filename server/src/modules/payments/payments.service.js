import { getClient, query } from "../../config/db.js";
import { AppError } from "../../utils/helpers.js";

const PLATFORM_FEE_RATE = 0.1;

const ensureWallet = async (client, userId) => {
  const existing = await client.query(
    `SELECT id, user_id, balance, updated_at
     FROM wallets
     WHERE user_id = $1`,
    [userId],
  );

  if (existing.rows[0]) return existing.rows[0];

  const created = await client.query(
    `INSERT INTO wallets (user_id)
     VALUES ($1)
     RETURNING id, user_id, balance, updated_at`,
    [userId],
  );

  return created.rows[0];
};

const getWalletByUserId = async (userId) => {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const wallet = await ensureWallet(client, userId);
    await client.query("COMMIT");
    return wallet;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const topupWallet = async (userId, data) => {
  const amount = Number(data.amount);
  const client = await getClient();

  try {
    await client.query("BEGIN");

    const wallet = await ensureWallet(client, userId);

    const updatedWallet = await client.query(
      `UPDATE wallets
       SET balance = balance + $2, updated_at = NOW()
       WHERE id = $1
       RETURNING id, user_id, balance, updated_at`,
      [wallet.id, amount],
    );

    const txn = await client.query(
      `INSERT INTO transactions
        (wallet_id, type, amount, status, pg_provider, pg_reference_id)
       VALUES
        ($1, 'topup', $2, 'completed', $3, $4)
       RETURNING *`,
      [
        wallet.id,
        amount,
        data.pgProvider || "manual",
        data.pgReferenceId || null,
      ],
    );

    await client.query("COMMIT");

    return {
      wallet: updatedWallet.rows[0],
      transaction: txn.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const verifyTopupWallet = async (userId, data) => {
  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError("Valid amount is required for verification", 400);
  }

  return topupWallet(userId, {
    ...data,
    amount,
    pgProvider: data.pgProvider || "razorpay",
    pgReferenceId:
      data.pgReferenceId ||
      data.razorpayPaymentId ||
      data.razorpayOrderId ||
      null,
  });
};

const payForRide = async (rideId, riderId, data) => {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    const rideRes = await client.query(
      `SELECT id, driver_id, status
       FROM rides
       WHERE id = $1`,
      [rideId],
    );
    const ride = rideRes.rows[0];
    if (!ride) throw new AppError("Ride not found", 404);
    if (ride.status !== "completed") {
      throw new AppError("Ride must be completed before payment", 400);
    }

    const participantRes = await client.query(
      `SELECT id, fare_amount
       FROM ride_participants
       WHERE ride_id = $1 AND rider_id = $2`,
      [rideId, riderId],
    );
    const participant = participantRes.rows[0];
    if (!participant) {
      throw new AppError("You are not a participant in this ride", 403);
    }

    const riderWallet = await ensureWallet(client, riderId);
    const driverWallet = await ensureWallet(client, ride.driver_id);

    const duplicatePayment = await client.query(
      `SELECT id
       FROM transactions
       WHERE ride_id = $1
         AND wallet_id = $2
         AND type = 'ride_payment'
         AND status = 'completed'`,
      [rideId, riderWallet.id],
    );
    if (duplicatePayment.rows[0]) {
      throw new AppError("Payment for this ride already completed", 409);
    }

    const fallbackAmount = Number(participant.fare_amount);
    const amount = Number(data.amount ?? fallbackAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AppError("Valid payment amount is required", 400);
    }

    const riderLocked = await client.query(
      `SELECT id, balance
       FROM wallets
       WHERE id = $1
       FOR UPDATE`,
      [riderWallet.id],
    );

    const driverLocked = await client.query(
      `SELECT id, balance
       FROM wallets
       WHERE id = $1
       FOR UPDATE`,
      [driverWallet.id],
    );

    const riderBalance = Number(riderLocked.rows[0].balance);
    if (riderBalance < amount) {
      throw new AppError("Insufficient wallet balance", 400);
    }

    const platformFee = Number((amount * PLATFORM_FEE_RATE).toFixed(2));
    const driverEarning = Number((amount - platformFee).toFixed(2));

    const updatedRiderWallet = await client.query(
      `UPDATE wallets
       SET balance = balance - $2, updated_at = NOW()
       WHERE id = $1
       RETURNING id, user_id, balance, updated_at`,
      [riderWallet.id, amount],
    );

    const updatedDriverWallet = await client.query(
      `UPDATE wallets
       SET balance = balance + $2, updated_at = NOW()
       WHERE id = $1
       RETURNING id, user_id, balance, updated_at`,
      [driverWallet.id, driverEarning],
    );

    const riderTxn = await client.query(
      `INSERT INTO transactions
        (wallet_id, ride_id, type, amount, status, pg_provider, pg_reference_id)
       VALUES
        ($1, $2, 'ride_payment', $3, 'completed', $4, $5)
       RETURNING *`,
      [
        riderWallet.id,
        rideId,
        amount,
        data.pgProvider || "wallet",
        data.pgReferenceId || null,
      ],
    );

    const driverTxn = await client.query(
      `INSERT INTO transactions
        (wallet_id, ride_id, type, amount, status)
       VALUES
        ($1, $2, 'ride_earning', $3, 'completed')
       RETURNING *`,
      [driverWallet.id, rideId, driverEarning],
    );

    const platformFeeTxn = await client.query(
      `INSERT INTO transactions
        (wallet_id, ride_id, type, amount, status)
       VALUES
        ($1, $2, 'platform_fee', $3, 'completed')
       RETURNING *`,
      [driverWallet.id, rideId, platformFee],
    );

    await client.query(
      `UPDATE rides
       SET total_fare = $2,
           driver_earning = $3,
           platform_fee = $4,
           updated_at = NOW()
       WHERE id = $1`,
      [rideId, amount, driverEarning, platformFee],
    );

    await client.query("COMMIT");

    return {
      riderWallet: updatedRiderWallet.rows[0],
      driverWallet: updatedDriverWallet.rows[0],
      payment: riderTxn.rows[0],
      earning: driverTxn.rows[0],
      platformFee: platformFeeTxn.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getMyTransactions = async (userId) => {
  const result = await query(
    `SELECT t.*
     FROM transactions t
     INNER JOIN wallets w ON w.id = t.wallet_id
     WHERE w.user_id = $1
     ORDER BY t.created_at DESC`,
    [userId],
  );

  return result.rows;
};

const withdrawFromWallet = async (userId, data) => {
  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError("Valid amount is required", 400);
  }

  const client = await getClient();

  try {
    await client.query("BEGIN");

    const wallet = await ensureWallet(client, userId);

    const lockedWallet = await client.query(
      `SELECT id, user_id, balance, updated_at
       FROM wallets
       WHERE id = $1
       FOR UPDATE`,
      [wallet.id],
    );

    const balance = Number(lockedWallet.rows[0].balance);
    if (balance < amount) {
      throw new AppError("Insufficient wallet balance", 400);
    }

    const updatedWallet = await client.query(
      `UPDATE wallets
       SET balance = balance - $2, updated_at = NOW()
       WHERE id = $1
       RETURNING id, user_id, balance, updated_at`,
      [wallet.id, amount],
    );

    const transaction = await client.query(
      `INSERT INTO transactions
        (wallet_id, type, amount, status, pg_provider, pg_reference_id)
       VALUES
        ($1, 'withdrawal', $2, 'completed', $3, $4)
       RETURNING *`,
      [
        wallet.id,
        amount,
        data.pgProvider || "manual_payout",
        data.pgReferenceId || null,
      ],
    );

    await client.query("COMMIT");

    return {
      wallet: updatedWallet.rows[0],
      transaction: transaction.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export {
  getWalletByUserId,
  topupWallet,
  verifyTopupWallet,
  withdrawFromWallet,
  payForRide,
  getMyTransactions,
};
