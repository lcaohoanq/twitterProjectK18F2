import { MongoClient, ServerApiVersion, Db, Collection } from "mongodb";
import User from "~/models/schemas/User.schema";
import dotenv from "dotenv";
import RefreshToken from "~/models/schemas/RefreshToken.schema";
import { Follower } from "~/models/schemas/Followers.schema";
import Tweet from "~/models/schemas/Tweet.schema";
dotenv.config();

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@tweetprojectk18f2.wdljj7x.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri);

class DatabaseService {
  private client: MongoClient;
  private db: Db;
  constructor() {
    this.client = new MongoClient(uri);
    this.db = this.client.db(process.env.DB_NAME);
  }
  async connect() {
    try {
      await this.db.command({ ping: 1 });
      // console.log("Pinged your deployment. You successfully connected to MongoDB!")
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  //nhờ vào việc dùng get, accessor property, ta sẽ sử dụng kiểu chấm trực tiếp user mà không cần ngoặc
  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USERS_COLLECTION as string);
  }

  //*tạo thêm 1 table có tên là refresh_token
  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTTION as string);
  }

  async indexRefreshTokens() {
    const isExists = await this.refreshTokens.indexExists(["token_1", "exp_1"]);
    if (isExists) return;
    this.refreshTokens.createIndex({ token: 1 });
    //đây là ttl index , sẽ tự động xóa các document khi hết hạn của exp
    this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 });
  }

  get followers(): Collection<Follower> {
    return this.db.collection(process.env.DB_FOLLOWERS_COLLECTION as string);
  }

  async indexFollowers() {
    const isExists = await this.followers.indexExists(["user_id_1_followed_user_id_1"]);
    if (isExists) return;
    this.followers.createIndex({ user_id: 1, followed_user_id: 1 });
  }

  async indexUsers() {
    // unique để tìm kiếm không trùng username và email
    const isExists = await this.users.indexExists(["username_1", "email_1", "email_1_password_1"]);

    if (isExists) return;

    await this.users.createIndex({ username: 1 }, { unique: true });
    await this.users.createIndex({ email: 1 }, { unique: true });
    await this.users.createIndex({ email: 1, password: 1 });
  }
  get tweets(): Collection<Tweet> {
    return this.db.collection(process.env.DB_TWEETS_COLLECTION as string);
  }
  //trong đó DB_TWEETS_COLLECTION lưu ở .env là 'tweets'
}

const databaseService = new DatabaseService();
export default databaseService;
