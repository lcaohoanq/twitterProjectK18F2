import express from "express";
import {
  accessTokenValidator,
  changePasswordValidator,
  emailVerifyTokenValidator,
  followValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  unfollowValidator,
  updateMeValidator,
  verifiedUserValidator,
  verifyForgotPasswordTokenValidator
} from "~/middlewares/users.middlewares";
import {
  changePasswordController,
  emailVerifyController,
  followController,
  forgotPasswordController,
  getMeController,
  getProfileController,
  loginController,
  logoutController,
  oAuthController,
  refreshTokenController,
  resendEmailVerifyController,
  resetPasswordController,
  unfollowController,
  updateMeController,
  verifyForgotPasswordTokenController
} from "~/controllers/users.controllers";
import { registerController } from "~/controllers/users.controllers";
import { wrapAsync } from "~/utils/handlers";
import { filterMiddleware } from "~/middlewares/common.middlewares";
import { UpdateMeReqBody } from "~/models/requests/User.requests";

const usersRouter = express.Router();

//middleWare
//những middleware này ta chỉ demo xem như thế nào thôi
//!xoá
// usersRouter.use(
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
usersRouter.post("/login", loginValidator, wrapAsync(loginController));

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
// usersRouter.post("/register", registerValidator, registerController)

//ta tạm thời cất hàm registerController để demo cách thức hoạt động của Request Handler
usersRouter.post("/register", registerValidator, wrapAsync(registerController));

//!khi gặp lỗi ta không được throw ra, phải dồn tất cả lỗi về Error Handler
//bổ sung next cho hàm đó
//nếu hàm đó là async ta sẽ xài try-catch cho async (next(error))

//ta sẽ đặt hàm xử lí lỗi này ở trên app tổng, đảm bảo tính reuse của nó cho toàn hệ thống

//kiểm tra access, kiểm tra refresh, xoá
usersRouter.post("/logout", accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController));

/* 
route: verify-email
method: post
path: /users/verify-email?
body: {
  email_verify_token: string
}
tại sao ta không gửi lên at,rt vì người dùng có thể đăng kí bằng máy tính và dùng đt để verify
*/

usersRouter.post("/verify-email", emailVerifyTokenValidator, wrapAsync(emailVerifyController));

/*
des:gửi lại verify email khi người dùng nhấn vào nút gửi lại email,
path: /resend-verify-email
method: POST
Header:{Authorization: Bearer <access_token>} //đăng nhập mới cho resend email verify
body: {}
*/
usersRouter.post("/resend-verify-email", accessTokenValidator, wrapAsync(resendEmailVerifyController));

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
usersRouter.post("/forgot-password", forgotPasswordValidator, wrapAsync(forgotPasswordController));

/*
des: Verify link in email to reset password
path: /verify-forgot-password
method: POST
Header: không cần, vì  ngta quên mật khẩu rồi, thì sao mà đăng nhập để có authen được
body: {forgot_password_token: string}
*/
usersRouter.post(
  "/verify-forgot-password",
  verifyForgotPasswordTokenValidator,
  wrapAsync(verifyForgotPasswordTokenController)
);

/*
des: reset password
path: '/reset-password'
method: POST
Header: không cần, vì  ngta quên mật khẩu rồi, thì sao mà đăng nhập để có authen được
body: {forgot_password_token: string, password: string, confirm_password: string} //!nhiệm vụ của mình là validate 3 cái này
*/
usersRouter.post(
  "/reset-password",
  resetPasswordValidator,
  verifyForgotPasswordTokenValidator,
  wrapAsync(resetPasswordController)
);

/*
des: get profile của user
path: '/me'
method: get
Header: {Authorization: Bearer <access_token>}
body: {}
*/
usersRouter.get("/me", accessTokenValidator, wrapAsync(getMeController));

/* 
des: 
path: '/me'
*/
usersRouter.patch(
  "/me",
  accessTokenValidator,
  verifiedUserValidator,
  filterMiddleware<UpdateMeReqBody>([
    "name",
    "date_of_birth",
    "bio",
    "location",
    "website",
    "avatar",
    "username",
    "cover_photo"
  ]),
  updateMeValidator,
  wrapAsync(updateMeController)
);

/*
des: get profile của user khác bằng unsername
path: '/:username'
method: get
không cần at,rt vì không cần đăng nhập cũng có thể xem thông tin của người khác
*/
usersRouter.get("/:username", wrapAsync(getProfileController));
//chưa có controller getProfileController, nên bây giờ ta làm

/*
des: Follow someone
path: '/follow'
method: post
headers: {Authorization: Bearer <access_token>}
body: {followed_user_id: string}
*/
usersRouter.post("/follow", accessTokenValidator, verifiedUserValidator, followValidator, wrapAsync(followController));
//accessTokenValidator dùng dể kiểm tra xem ngta có đăng nhập hay chưa, và có đc user_id của người dùng từ req.decoded_authorization
//verifiedUserValidator dùng để kiễm tra xem ngta đã verify email hay chưa, rồi thì mới cho follow người khác
//trong req.body có followed_user_id  là mã của người mà ngta muốn follow
//followValidator: kiểm tra followed_user_id truyền lên có đúng định dạng objectId hay không
//  account đó có tồn tại hay không
//followController: tiến hành thao tác tạo document vào collection followers
/* 
luucaohoang.1@gmail.com
_id 654c7f531deb0ae2d089b2f0

luucaohoang.2@gmail.com
_id: 654c7fa11deb0ae2d089b2f4
*/

/*
    des: unfollow someone
    path: '/unfollow/:user_id'
    method: delete
    headers: {Authorization: Bearer <access_token>}
*/
usersRouter.delete(
  "/unfollow/:user_id",
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  wrapAsync(unfollowController)
);

//unfollowValidator: kiểm tra user_id truyền qua params có hợp lệ hay k?

/*
  des: change password
  path: '/change-password'
  method: PUT
  headers: {Authorization: Bearer <access_token>}
  Body: {old_password: string, password: string, confirm_password: string}
g}
  */
usersRouter.put(
  "/change-password",
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapAsync(changePasswordController)
);
//changePasswordValidator kiểm tra các giá trị truyền lên trên body cớ valid k ?

/*
  des: refreshtoken
  path: '/refresh-token'
  method: POST
  Body: {refresh_token: string}
g}
  */
usersRouter.post("/refresh-token", refreshTokenValidator, wrapAsync(refreshTokenController));
//khỏi kiểm tra accesstoken, tại nó hết hạn rồi mà
//refreshController chưa làm

usersRouter.get("/oauth/google", wrapAsync(oAuthController));

export default usersRouter;
