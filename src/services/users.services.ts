import User from "~/models/schemas/User.schema"
import databaseService from "./database.services"
import { RegisterReqBody } from "~/models/requests/User.requests"
import { hashPassword } from "~/utils/crypto"
import { signToken } from "~/utils/jwt"
import { TokenType, UserVerifyStatus } from "~/constants/enums"
import RefreshToken from "~/models/schemas/RefreshToken.schema"
import { ObjectId } from "mongodb"
import { USERS_MESSAGES } from "~/constants/messages"

class UsersService {
  //TODO: Hàm nhận vào user_id (định danh mình là ai) và bỏ vào payload để tạo access_token
  private signAccessToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      //không cần bỏ secretKey vì ta đã để optional
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN },
      //vì đã update trong env các jwt secret mới, và ta đã customize trong jwt nên cần phải thay đổi
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
    })
  }

  //TODO: Hàm nhận vào user_id (định danh mình là ai) và bỏ vào payload để tạo refresh_token
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken },
      //không cần bỏ secretKey vì ta đã để optional
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN },
      //vì đã update trong env các jwt secret mới, và ta đã customize trong jwt nên cần phải thay đổi
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }

  //TODO: hàm kí access và resfresh token
  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)])
  }
  //?Xài 2 hàm trên ở đâu? Khi mà ta đăng kí thì ta sẽ tạo 2 mã này đưa cho người dùng, khi người dùng làm gì, gửi ngược lại mình cái mã này là mình sẽ biết đó là ai

  //!thêm 1 hàm emailVerifyToken (có tác dụng để gửi email cho người dùng, người dùng mở ra và gửi lại ta cái mã thì verify trong db = 0 -> 1)
  private signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerificationToken },
      //không cần bỏ secretKey vì ta đã để optional
      options: { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRE_IN },
      //vì đã update trong env các jwt secret mới, và ta đã customize trong jwt nên cần phải thay đổi
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
    })
  }

  //TODO: tạo hàm signForgotPasswordToken
  private signForgotPasswordToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.ForgotPassWordToken },
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string //thêm
    })
  }

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
    //ta tự tạo 1 user_id mà không cần nhờ đến mongo nữa
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())

    //trong result này có gì?
    //"acknowledge"
    //?"insertId" : "6533999f3ef6c1c7d752a435"
    //mình sẽ lấy cái mã này đóng gói lại -> token -> đưa người dùng
    //người dùng sẽ cầm token này đưa cho mình, khi yêu cầu sử dụng dịch vụ nào đó
    const result = await databaseService.users.insertOne(
      //!
      new User({
        //ta cần phải tạo 1 User với tất cả những thông tin có trong RegisterReqBody

        //phân rã ra
        ...payload,
        //ta bị báo lỗi, tại vì trong RRB của mình có date_of_birth
        //trong payload cũng có date_of_birth
        //?vậy biết lấy thằng nào

        _id: user_id,
        email_verify_token,

        //!xử lí bằng cách override lại
        date_of_birth: new Date(payload.date_of_birth),
        //payload.date_of_birth là một string được ép kiểu về date
        password: hashPassword(payload.password)
      })
    )

    //*ta hứng vào user_id để đổ lên db
    // const user_id = result.insertedId.toString() //đây là hành động mà ta lấy của mongoDB

    //!ta kí theo cách thông thường, synchronus, nhưng nó không hợp lí
    // const access_token = await this.signAccessToken(user_id)
    // const refresh_token = await this.signRefreshToken(user_id)

    // *ta chủ đích sử dụng kí bất đồng bộ
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id.toString())
    //phân rã mảng ta xài ngoặc vuông

    //!ta không trả ra result cho người dùng nữa
    // return result

    //!lưu refreshtoken sau khi lưu user vào db
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    //giả lập gửi mail bằng console.log
    //thông tin này ta sẽ gửi vào mail của người đăng kí, và người đăng kí sẽ đưa lại mình
    console.log("email_verify_token\n", email_verify_token)
    //!khi mình đăng kí một user thành công thì terminal sẽ trả cho mình cái emailverifytoken vào trong terminal

    //* ta trả ra cho client at và rt
    return { access_token, refresh_token }
  }

  async login(user_id: string) {
    //dùng user_id để tạo access và refresh token
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)

    //!lưu refreshtoken vào db
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )

    return { access_token, refresh_token }
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return {
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    }
  }

  async verifyEmail(user_id: string) {
    //cập nhật lại user
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            verify: UserVerifyStatus.Verified,
            email_verify_token: "",
            updated_at: "$$NOW"
          }
        }
      ]
    )
    //nếu verify xong thì ta sẽ gửi lại at, rt cho người dùng
    //để cung cấp dịch vụ cho họ ngay
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)
    //lưu at và rt vào db
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return { access_token, refresh_token }
  }

  async resendEmailVerify(user_id: string) {
    //tạo ra email_verify_token mới
    const email_verify_token = await this.signEmailVerifyToken(user_id)
    //chưa làm chức năng gửi email, nên giả bộ ta đã gửi email cho client rồi, hiển thị bằng console.log
    console.log("resend verify email token\n", email_verify_token)
    //vào database và cập nhật lại email_verify_token mới trong table user
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: { email_verify_token: email_verify_token, updated_at: "$$NOW" }
      }
    ])
    //trả về message
    // console.log(email_verify_token)

    return {
      message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
    }
  }

  async forgotPassword(user_id: string) {
    //tạo ra forgot_password_token
    const forgot_password_token = await this.signForgotPasswordToken(user_id)

    //gửi email cho người dùng đường link có cấu trúc như này
    //http://appblabla/forgot-password?token=xxxx
    //xxxx trong đó xxxx là forgot_password_token
    //sau này ta sẽ dùng aws để làm chức năng gửi email, giờ ta k có
    //ta log ra để test
    // console.log("forgot_password_token\n", forgot_password_token)

    //cập nhật lại user vào forgot_password_token và user_id
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: { forgot_password_token: forgot_password_token, updated_at: "$$NOW" }
      }
    ])

    console.log("forgot_password_token\n", forgot_password_token)
    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }

  async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    //TODO: tìm user thông qua user_id và cập nhật lại password và forgot_password_token
    //tất nhiên là lưu password đã hash rồi
    //ta không cần phải kiểm tra user có tồn tại không, vì forgotPasswordValidator đã làm rồi
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: "", //*không thể dùng token để đổi mk 2 lần
          updated_at: "$$NOW"
        }
      }
    ])
    //nếu bạn muốn ngta đổi mk xong tự động đăng nhập luôn thì trả về access_token và refresh_token
    //ở đây mình chỉ cho ngta đổi mk thôi, nên trả về message
    return {
      message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
    }
  }
}

const usersService = new UsersService()
export default usersService
