import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { TWEETS_MESSAGES } from "~/constants/messages";
import { TweetRequestBody } from "~/models/requests/Tweet.requests";
import { TokenPayload } from "~/models/requests/User.requests";
import tweetsServices from "~/services/tweets.services";

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequestBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  //lấy dể biết ai là người đăng
  const body = req.body as TweetRequestBody; // và đăng cái gì
  const result = await tweetsServices.createTweets(user_id, body); //createTweet chưa code
  res.json({
    message: TWEETS_MESSAGES.TWEET_CREATED_SUCCESSFULLY, // thêm TWEET_CREATED_SUCCESSFULLY: 'Tweet created success'
    result
  });
};
