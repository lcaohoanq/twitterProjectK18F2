///ta bị bug vì implment interface của FectchAPI nhưng ta lại muốn sử dụng của express
///import các interface để định dạng kiểu cho para của middlewares
import { NextFunction, Request, RequestHandler, Response } from "express"
import User from "~/models/schemas/User.schema"
import databaseService from "~/services/database.services"
import usersService from "~/services/users.services"
//1 req của client gữi lên server sẽ có body(chứa các thứ cẫn gữi)

import { ParamsDictionary } from "express-serve-static-core"
import {
  ForgotPasswordReqBody,
  LoginReqBody,
  LogoutReqBody,
  RegisterReqBody,
  ResetPasswordReqBody,
  TokenPayload,
  VerifyEmailReqBody,
  VerifyForgotPasswordReqBody
} from "~/models/requests/User.requests"
import { error } from "console"
import { ErrorWithStatus } from "~/models/Errors"
import { ObjectId } from "mongodb"
import { USERS_MESSAGES } from "~/constants/messages"
import { UserVerifyStatus } from "~/constants/enums"
import HTTP_STATUS from "~/constants/httpStatus"

export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  // throw new Error('test Error') //những người thường throw lỗi sẽ throw lỗi bằng cách này, nhưng cái flow của nó không phù hợp với ErrorWithStatus

  //lấy user_id từ user của request
  // const { user }: any = req

  const user = req.user as User //không phân rã nữa

  const user_id = user._id as ObjectId //thằng này ta lấy về từ mongo

  //dùng user_id tạo access_token và refresh_token
  const result = await usersService.login(user_id.toString())
  //login dùng để nhận user_id và trả về access_token và refresh_token

  //response access_token và refresh_token về cho client
  res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  })

  /*   const { email, password } = req.body
  if (email === "test@gmail.com" || password === "123456") {
    return res.json({
      message: "login successfully",
      result: [
        { fname: "Điệp", yob: 1999 },
        { fname: "Hùng", yob: 2003 },
        { fname: "Được", yob: 1994 }
      ]
    })
  } else {
    return res.status(400).json({
      error: "login failed"
    })
  } */
}

// export const registerController = async (
//   req: Request<ParamsDictionary, any, RegisterReqBody>,
//   res: Response,
//   next: NextFunction
// ) => {
//   //vì trong mô tả của một user đã có email và password, ta đã biết chắc chắn định dạng của email và password như thế nào
//   //ta sẽ check sương sương 2 thằng này

//   //* const { email, password } = req.body

//   //nếu chuẩn ta phải truyền nhiều thông tin vào
//   //email, password, name, ...
//   //!req.body bị any -> giải pháp: tạo ra 1 interface định nghĩa lại req.body là ntn

//   //!ta bọc lại bằng try-catch vì quá trình này hay phát sinh lỗi (rớt mạng)
//   try {
//     //ta demo throw lỗi cho hàm ansync với error handler
//     throw new Error("Tạo thử một cái lỗi nè")

//     //ta giả bộ với email và password này đã ngon và không cần middleware nữa
//     //insertOne: hàm của mongo, là một promise trả ra dữ liệu
//     // const result = await usersService.register({ email, password })
//     const result = await usersService.register(req.body)

//     res.json({
//       message: "register successfully",
//       result
//     })
//   } catch (err) {
//     // res.status(400).json({
//     //   message: "register failed",
//     //   err
//     // })

//     //demo lỗi với next
//     next(err)
//   }
// }

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  //vì trong mô tả của một user đã có email và password, ta đã biết chắc chắn định dạng của email và password như thế nào
  //ta sẽ check sương sương 2 thằng này

  //* const { email, password } = req.body

  //nếu chuẩn ta phải truyền nhiều thông tin vào
  //email, password, name, ...
  //!req.body bị any -> giải pháp: tạo ra 1 interface định nghĩa lại req.body là ntn

  //!ta bọc lại bằng try-catch vì quá trình này hay phát sinh lỗi (rớt mạng)

  // throw new Error("Tạo thử một cái lỗi nè")

  //ta giả bộ với email và password này đã ngon và không cần middleware nữa
  //insertOne: hàm của mongo, là một promise trả ra dữ liệu
  // const result = await usersService.register({ email, password })
  const result = await usersService.register(req.body)

  res.json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  })
}

//?Có một vấn đề với việc sử dụng try-catch quá nhiều như này trong quá trình phát triển ứng dụng
//ta sẽ tạo thêm 1 cái hàm chỉ để xử lí try-catch thôi
//không cần bọc try-catch trong middleware và controller (và những thằng async)
// function(func: RequestHandler) => {
//   return(req,res,next)=>{
//     try{

//     }catch(error){
//       next(error)
//     }
//   }
// }

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  //lấy refresh_token từ req.body
  //tìm trong database xem có refresh_token này không
  //nếu có thì xoá (mà ta đã tìm được từ tầng ở trên rồi)

  //!vào database xoá refresh_token đã tìm được

  const { refresh_token } = req.body

  //logout vào db và xoá refresh token
  const result = await usersService.logout(refresh_token)

  res.json(result)
}

export const emailVerifyController = async (
  req: Request<ParamsDictionary, any, VerifyEmailReqBody>,
  res: Response,
  next: NextFunction
) => {
  // const { email_verify_token } = req.body
  // const user = await databaseService.users.findOne({ email_verify_token: email_verify_token })
  //ta có thể tìm user thông qua email_verify_token do người dùng gui lên lên thế này nhưng hiệu năng sẽ kém
  //nên thay vào đó ta sẽ lấy thông tin _id của user từ decoded_email_verify_token mà ta thu được từ middleware trước
  //và tìm user thông qua _id đó
  const { user_id } = req.decoded_email_verify_token as TokenPayload

  //!cách này bth
  // const user = await databaseService.users.findOne({
  //   _id: new ObjectId(user_id),
  // }); //hiệu năng cao hơn
  // //nếu k có user thì cho lỗi 404: not found

  //ta đã hứng user ở bên middleware
  const user = req.user as User

  //nếu đã verify rồi thì
  if (user.verify === UserVerifyStatus.Verified) {
    //mặc định là status 200
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }

  //nếu mà xuống được đây nghĩa user này chưa verify, chưa bị banned, và khớp mã
  //!NGON
  //mình tiến hành update: verify: 1, xoá email_mail_verify_token, update_at

  const result = await usersService.verifyEmail(user_id)
  //để cập nhật lại email_verify_token thành rỗng và tạo ra access_token và refresh_token mới
  //gửi cho người vừa request email verify đang nhập
  return res.json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result: result
  })
}

export const resendEmailVerifyController = async (req: Request, res: Response, next: NextFunction) => {
  //?nếu vô được đây thì
  //khi đến đây thì accesstokenValidator đã chạy rồi => access_token đã được decode
  //và lưu vào req.user, nên trong đó sẽ có user._id để tao sử dụng
  const { user_id } = req.decoded_authorization as TokenPayload //lấy user_id từ decoded_authorization
  //từ user_id này ta sẽ tìm user trong database
  const user = await databaseService.users.findOne({
    _id: new ObjectId(user_id)
  })
  //nếu k có user thì trả về lỗi 404: not found
  if (!user) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }
  //!cập nhật thêm, check banned
  if (user.verify == UserVerifyStatus.Banned) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_BANNED,
      status: HTTP_STATUS.FORBIDDEN
    })
  }

  //nếu user đã verify email trước đó rồi thì trả về lỗi 400: bad request
  if (user.verify == UserVerifyStatus.Verified) {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }
  //nếu user chưa verify email thì ta sẽ gửi lại email verify cho họ
  //cập nhật email_verify_token mới và gửi lại email verify cho họ
  const result = await usersService.resendEmailVerify(user_id)
  //result chứa message nên ta chỉ cần trả  result về cho client
  return res.json(result)
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  //middleware forgotPasswordValidator đã chạy rồi, nên ta có thể lấy _id từ user đã tìm được bằng email

  //nếu ta lấy ra từ mongo -> _id
  //lấy ra từ payload      -> user_id
  const { _id } = req.user as User
  //cái _id này là objectid, nên ta phải chuyển nó về string
  //!_id là thuộc tính của mongoDB với kiểu là ObjectId
  //chứ không truyền trực tiếp vào hàm forgotPassword
  const result = await usersService.forgotPassword((_id as ObjectId).toString())
  return res.json(result)

  // return res.json({
  //   message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_SUCCESS
  // })
}

export const verifyForgotPasswordTokenController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  //nếu đã đến bước này nghĩa là ta đã tìm có forgot_password_token hợp lệ
  //và đã lưu vào req.decoded_forgot_password_token
  //thông tin của user
  //ta chỉ cần thông báo rằng token hợp lệ
  return res.json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS
  })
}
//trong messages.ts thêm   VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS: 'Verify forgot password token success'

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  //muốn đổi mật khẩu, ta cần user_id và password mới
  const { user_id } = req.decoded_forgot_password_token as TokenPayload

  //nhớ rằng khi đụng đến body ta sẽ định nghĩa lại
  const { password } = req.body

  //tiến hành cập nhạt, vào trong services
  const result = await usersService.resetPassword({ user_id, password })
  return res.json(result)
}
