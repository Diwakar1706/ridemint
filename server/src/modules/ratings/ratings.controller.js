import { AppError } from "../../utils/helpers.js";
import * as ratingsService from "./ratings.service.js";

const create = async (req, res) => {
  const { rideId, toUserId, score } = req.body;
  if (!rideId || !toUserId || score === undefined || score === null) {
    throw new AppError("rideId, toUserId and score are required", 400);
  }

  const numericScore = Number(score);
  if (!Number.isInteger(numericScore) || numericScore < 1 || numericScore > 5) {
    throw new AppError("score must be an integer between 1 and 5", 400);
  }

  const rating = await ratingsService.createRating(req.user.userId, {
    ...req.body,
    score: numericScore,
  });

  res.status(201).json({ success: true, rating });
};

const getReceived = async (req, res) => {
  const ratings = await ratingsService.getMyReceivedRatings(req.user.userId, {
    limit: req.query.limit,
  });
  res.json({ success: true, count: ratings.length, ratings });
};

const getGiven = async (req, res) => {
  const ratings = await ratingsService.getMyGivenRatings(req.user.userId, {
    limit: req.query.limit,
  });
  res.json({ success: true, count: ratings.length, ratings });
};

export { create, getReceived, getGiven };
