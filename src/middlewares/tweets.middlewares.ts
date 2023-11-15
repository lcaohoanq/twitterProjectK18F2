import { Request, Response, NextFunction } from "express";
import { checkSchema } from "express-validator";
import { isEmpty } from "lodash";
import { ObjectId } from "mongodb";
import { MediaType, TweetAudience, TweetType } from "~/constants/enums";
import { TWEETS_MESSAGES } from "~/constants/messages";
import { numberEnumToArray } from "~/utils/commons";
import { validate } from "~/utils/validation";

const tweetTypes = numberEnumToArray(TweetType); //kq có dạng [0, 1, 2, 3]
const tweetAudiences = numberEnumToArray(TweetAudience); //kq có dạng [0, 1]
const mediaTypes = numberEnumToArray(MediaType); //kq có dạng [0, 1]

export const createTweetValidator = validate(
  checkSchema(
    {
      type: {
        isIn: {
          options: [tweetTypes], //doc bảo là phải truyền [[0,1,2,3]]
          errorMessage: TWEETS_MESSAGES.INVALID_TYPE
        }
      },
      audience: {
        isIn: {
          options: [tweetAudiences],
          errorMessage: TWEETS_MESSAGES.INVALID_AUDIENCE
        }
      },
      parent_id: {
        custom: {
          options: (value, { req }) => {
            const type = req.body.type as TweetType;
            //nếu `type` là `retweet` , `comment` , `quotetweet` thì `parent_id` phải là `tweet_id` của tweet cha
            //*[TweetType.Retweet, TweetType.Comment, TweetType.QuoteTweet].includes(type)
            if (type != TweetType.Tweet && !ObjectId.isValid(value)) {
              throw new Error(TWEETS_MESSAGES.PARENT_ID_MUST_BE_A_VALID_TWEET_ID);
            }
            // nếu `type` là `tweet` thì `parent_id` phải là `null`
            if (type == TweetType.Tweet && value != null) {
              throw new Error(TWEETS_MESSAGES.PARENT_ID_MUST_BE_NULL);
            }
            //oke thì trả về true
            return true;
          }
        }
      },
      content: {
        isString: true,
        custom: {
          options: (value, { req }) => {
            const type = req.body.type as TweetType;
            const mentions = req.body as string[]; //không dùng destructuring vì không định nghĩa kiểu dữ liệu được
            const hashtags = req.body as string[];
            //nếu `type` là `tweet` , `comment` , `quotetweet` và không có mention hay hashtag thì `content` phải là string và không được rỗng
            //*[TweetType.Tweet, TweetType.Comment, TweetType.QuoteTweet].includes(type)
            if (type != TweetType.Retweet && isEmpty(mentions) && isEmpty(hashtags) && value.trim() == "") {
              //isEmpty() của lodash
              throw new Error(TWEETS_MESSAGES.CONTENT_MUST_BE_A_NON_EMPTY_STRING);
            }
            // nếu `type` là `retweet` thì `content` phải là `''`
            if (type == TweetType.Retweet && value != "") {
              throw new Error(TWEETS_MESSAGES.CONTENT_MUST_BE_EMPTY_STRING);
            }
            //oke thì trả về true
            return true;
          }
        }
      },
      hashtags: {
        isArray: true,
        custom: {
          options: (value, { req }) => {
            //!value = hashtag
            //yêu cầu mỗi phần tử trong array hashtag phải là string, nếu không có thì throw lỗi
            if (value.some((item: any) => typeof item !== "string")) {
              throw new Error(TWEETS_MESSAGES.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING);
            }
            //oke thì trả về true
            return true;
          }
        }
      },
      mentions: {
        isArray: true,
        custom: {
          options: (value, { req }) => {
            //yêu cầu mỗi phần tử trong array phải là user_id
            if (value.some((item: any) => !ObjectId.isValid(item))) {
              throw new Error(TWEETS_MESSAGES.MENTIONS_MUST_BE_AN_ARRAY_OF_user_id);
            }
            //oke thì trả về true
            return true;
          }
        }
      },
      medias: {
        isArray: true,
        custom: {
          options: (value, { req }) => {
            //yêu cầu mỗi phần tử trong array phải là Media Object
            if (
              value.some((item: any) => {
                return typeof item.url !== "string" || !mediaTypes.includes(item.type);
              })
            ) {
              throw new Error(TWEETS_MESSAGES.MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT);
            }
            //oke thì trả về true
            return true;
          }
        }
      }
    },

    ["body"]
  )
);
