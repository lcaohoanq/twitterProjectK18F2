import express from "express"
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  verifyForgotPasswordTokenValidator
} from "~/middlewares/users.middlewares"
import {
  emailVerifyController,
  forgotPasswordController,
  loginController,
  logoutController,
  resendEmailVerifyController,
  resetPasswordController,
  verifyForgotPasswordTokenController
} from "~/controllers/users.controllers"
import { registerController } from "~/controllers/users.controllers"
import { wrapAsync } from "~/utils/handlers"

const usersRoute = express.Router()

//middleWare
//những middleware này ta chỉ demo xem như thế nào thôi
//!xoá
// usersRoute.use(
//   (req, res, next) => {
//     console.log('Time: ', Date.now())
//     next()
//     //hàm next ám chỉ rằng các bước đầu tiên đã xác thực xong
//     //cho phép đi đến hàm tiếp theo -> controller ở dưới

//     //!nếu không có next thì sao?
//     //server sẽ xử lí hoài luôn không thoát ra được -> postman bị pending

//     //*TA THÊM bấy nhiêu middleware tuỳ ý
//   },
//   (req, res, next) => {
//     console.log('Time: ', Date.now())
//     return res.status(400).send('ahihi đồ chó')
//     //giả sử middleware thứ 2 ta không next mà ta log ra lỗi
//     console.log('dòng này vẫn chạy, middleware không skip qua, không làm dừng hàm')
//     //ta muốn ngừng, dùng return
//   },
//   (req, res, next) => {
//     console.log('Time: ', Date.now())
//     next()
//   }
// )

//tách hàm để viết các method
//đổi tweets thành login
//ta không sử import từ đầu vì nếu cần thì ta mới gọi tới loginValidator

/*!!!!!!!
des: đăng nhập
path: /users/login
method: POST
body: {email, password}
*/

//*bọc lại wrapAsync
usersRoute.get("/login", loginValidator, wrapAsync(loginController))

//thêm 1 method post
//giả vờ người dùng đưa ta một register hoàn hảo, không cần phải validate
//ta dev chức năng registerController (thật ra phải thêm một registerValidator)

/*
Description: Register new user
Path: /register
body:{
    name: string
    email: string
    password: string
    confirm_password: string
    date_of_birth: string theo chuẩn ISO 8601
    
    ?tại sao không phải là Date, vì người dùng chỉ truyền vào json làm gì có Date

    !tại sao không xài cammel case
    *vì mongoDB chỉ chấp nhận snake case
}
*/
// usersRoute.post("/register", registerValidator, registerController)

//ta tạm thời cất hàm registerController để demo cách thức hoạt động của Request Handler
usersRoute.post("/register", registerValidator, wrapAsync(registerController))

//!khi gặp lỗi ta không được throw ra, phải dồn tất cả lỗi về Error Handler
//bổ sung next cho hàm đó
//nếu hàm đó là async ta sẽ xài try-catch cho async (next(error))

//ta sẽ đặt hàm xử lí lỗi này ở trên app tổng, đảm bảo tính reuse của nó cho toàn hệ thống

//kiểm tra access, kiểm tra refresh, xoá
usersRoute.post("/logout", accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))

/* 
route: verify-email
method: post
path: /users/verify-email?
body: {
  email_verify_token: string
}
tại sao ta không gửi lên at,rt vì người dùng có thể đăng kí bằng máy tính và dùng đt để verify
*/

usersRoute.post("/verify-email", emailVerifyTokenValidator, wrapAsync(emailVerifyController))

/*
des:gửi lại verify email khi người dùng nhấn vào nút gửi lại email,
path: /resend-verify-email
method: POST
Header:{Authorization: Bearer <access_token>} //đăng nhập mới cho resend email verify
body: {}
*/
usersRoute.post("/resend-verify-email", accessTokenValidator, wrapAsync(resendEmailVerifyController))

//vì người dùng sẽ truyền lên accesstoken, nên ta sẽ dùng lại accessTokenValidator để kiểm tra
//accesstoken đó

//:
//resendEmailVerifyController:
//    1. kiểm tra xem account đã verify chưa, nếu nó verify rồi thì ta
//      không cần tiến hành gửi email lại cho client
//    2. nếu chưa verify thì controller ta sẽ tạo để xử lý việc resend email verify
//    c

/*
des: cung cấp email để reset password, gửi email cho người dùng
path: /forgot-password
method: POST
Header: không cần, vì  ngta quên mật khẩu rồi, thì sao mà đăng nhập để có authen được
body: {email: string}
*/
usersRoute.post("/forgot-password", forgotPasswordValidator, wrapAsync(forgotPasswordController))

/*
des: Verify link in email to reset password
path: /verify-forgot-password
method: POST
Header: không cần, vì  ngta quên mật khẩu rồi, thì sao mà đăng nhập để có authen được
body: {forgot_password_token: string}
*/
usersRoute.post(
  "/verify-forgot-password",
  verifyForgotPasswordTokenValidator,
  wrapAsync(verifyForgotPasswordTokenController)
)

/*
des: reset password
path: '/reset-password'
method: POST
Header: không cần, vì  ngta quên mật khẩu rồi, thì sao mà đăng nhập để có authen được
body: {forgot_password_token: string, password: string, confirm_password: string} //!nhiệm vụ của mình là validate 3 cái này
*/
usersRoute.post(
  "/reset-password",
  resetPasswordValidator,
  verifyForgotPasswordTokenValidator,
  wrapAsync(resetPasswordController)
)

export default usersRoute
