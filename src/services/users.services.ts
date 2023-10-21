import User from "~/models/schemas/User.schema"
import databaseService from "./database.services"
import { RegisterReqBody } from "~/models/requests/User.requests"
import { hashPassword } from "~/utils/crypto"
import { signToken } from "~/utils/jwt"
import { TokenType } from "~/constants/enums"

class UsersService {
  //TODO: Hàm nhận vào user_id (định danh mình là ai) và bỏ vào payload để tạo access_token
  private signAccessToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      //không cần bỏ secretKey vì ta đã để optional
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN }
    })
  }

  //TODO: Hàm nhận vào user_id (định danh mình là ai) và bỏ vào payload để tạo refresh_token
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken },
      //không cần bỏ secretKey vì ta đã để optional
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN }
    })
  }
  //?Xài 2 hàm trên ở đâu? Khi mà ta đăng kí thì ta sẽ tạo 2 mã này đưa cho người dùng, khi người dùng làm gì, gửi ngược lại mình cái mã này là mình sẽ biết đó là ai

  async checkEmailExist(email: string) {
    const users = await databaseService.users.findOne({ email: email })
    //users này trả về một cái User | null
    //ta ép kiểu về boolean true|false
    return Boolean(users)
  }

  //*demo với email và password

  // async register(payload: { email: string; password: string }) {
  //   const { email, password } = payload
  //   const result = await databaseService.users.insertOne(
  //     new User({
  //       email, //tạo user chỉ cần email, password
  //       password
  //     })
  //   )
  //   return result
  // }

  //!ta định nghĩa lại RegisterReqBody = payload

  async register(payload: RegisterReqBody) {
    //trong result này có gì?
    //"acknowledge"
    //?"insertId" : "6533999f3ef6c1c7d752a435"
    //mình sẽ lấy cái mã này đóng gói lại -> token -> đưa người dùng
    //người dùng sẽ cầm token này đưa cho mình, khi yêu cầu sử dụng dịch vụ nào đó
    const result = await databaseService.users.insertOne(
      new User({
        //ta cần phải tạo 1 User với tất cả những thông tin có trong RegisterReqBody

        //phân rã ra
        ...payload,
        //ta bị báo lỗi, tại vì trong RRB của mình có date_of_birth
        //trong payload cũng có date_of_birth
        //?vậy biết lấy thằng nào

        //!xử lí bằng cách override lại
        date_of_birth: new Date(payload.date_of_birth),
        //payload.date_of_birth là một string được ép kiểu về date
        password: hashPassword(payload.password)
      })
    )

    //*ta hứng vào user_id
    const user_id = result.insertedId.toString()

    //!ta kí theo cách thông thường, synchronus, nhưng nó không hợp lí
    // const access_token = await this.signAccessToken(user_id)
    // const refresh_token = await this.signRefreshToken(user_id)

    // *ta chủ đích sử dụng kí bất đồng bộ
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id)
    ])
    //phân rã mảng ta xài ngoặc vuông

    //!ta không trả ra result cho người dùng nữa
    // return result

    //* mà trả ra này
    return { access_token, refresh_token }
  }
}

const usersService = new UsersService()
export default usersService