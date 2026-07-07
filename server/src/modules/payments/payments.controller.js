import { AppError } from "../../utils/helpers.js";
import * as paymentsService from "./payments.service.js";

const getWallet = async (req, res) => {
  const wallet = await paymentsService.getWalletByUserId(req.user.userId);
  res.json({ success: true, wallet });
};

const topup = async (req, res) => {
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError("Valid amount is required", 400);
  }

  const result = await paymentsService.topupWallet(req.user.userId, req.body);
  res.status(201).json({ success: true, ...result });
};

const topupVerify = async (req, res) => {
  const result = await paymentsService.verifyTopupWallet(
    req.user.userId,
    req.body,
  );

  res.status(201).json({ success: true, ...result });
};

const withdraw = async (req, res) => {
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError("Valid amount is required", 400);
  }

  const result = await paymentsService.withdrawFromWallet(
    req.user.userId,
    req.body,
  );

  res.status(201).json({ success: true, ...result });
};

const payRide = async (req, res) => {
  const result = await paymentsService.payForRide(
    req.params.rideId,
    req.user.userId,
    req.body,
  );

  res.status(201).json({ success: true, ...result });
};

const getTransactions = async (req, res) => {
  const transactions = await paymentsService.getMyTransactions(req.user.userId);
  res.json({ success: true, count: transactions.length, transactions });
};

export { getWallet, topup, topupVerify, withdraw, payRide, getTransactions };
