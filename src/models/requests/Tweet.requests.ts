import { TweetAudience, TweetType } from "~/constants/enums";
import { Media } from "../Other";

export interface TweetRequestBody {
  type: TweetType;
  audience: TweetAudience;
  content: string;
  parent_id: null | string; // k là ObjectId vì
  hashtags: string[]; //người dùng truyền lên dạng string, ta không thể truyền vào object id
  mentions: string[]; //mình sẽ convert sang ObjectId sau
  medias: Media[];
}
