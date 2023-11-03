import { MongoClient, ServerApiVersion, Db, Collection } from "mongodb"
import User from "~/models/schemas/User.schema"
import dotenv from "dotenv"
import RefreshToken from "~/models/schemas/RefreshToken.schema"
dotenv.config()

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@tweetprojectk18f2.wdljj7x.mongodb.net/?retryWrites=true&w=majority`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri)

class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME)
  }
  async connect() {
    try {
      await this.db.command({ ping: 1 })
      // console.log("Pinged your deployment. You successfully connected to MongoDB!")
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  //nhờ vào việc dùng get, accessor property, ta sẽ sử dụng kiểu chấm trực tiếp user mà không cần ngoặc
  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USERS_COLLECTION as string)
  }

  //*tạo thêm 1 table có tên là refresh_token
  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTTION as string)
  }
}

const databaseService = new DatabaseService()
export default databaseService
