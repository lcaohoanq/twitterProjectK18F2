import express from "express"
import { loginValidator, registerValidator } from "~/middlewares/users.middlewares"
import { loginController } from "~/controllers/users.controllers"
import { registerController } from "~/controllers/users.controllers"

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
usersRoute.get("/login", loginValidator, loginController)

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
usersRoute.post(
  "/register",
  registerValidator,
  (req, res, next) => {
    console.log("request handler 1")
    next()
  },
  (req, res, next) => {
    console.log("request handler 2")
    // next(new Error("Error from request handler 2"))
    //nếu ta next ra một cái lỗi như này thì lỗi sẽ chạy đến tầng ErrorHandler gần nhất kế tiếp
    //ở trường hợp này ta không có một errorHandler nào cả
    //tức là không có ai chụp lỗi này, nên nó bị bung ra màn hình

    //?thay vì dùng new Error ta có thể dùng throw
    throw new Error("Error from request handler 2")
    //!try-catch có một nhược điểm, sẽ không bắt lỗi được trong môi trường bất đồng bộ (async)

    //TODO: hàm bình thường       next, throw
    //TODO: hàm async             next, throw là bị lỗi (khác phục bằng try-catch Promise)
  },
  (req, res, next) => {
    console.log("request handler 3")
    next()
  },
  (req, res, next) => {
    console.log("request handler 4")
    res.json({ message: "register successfully" })
  },
  //*ta sẽ ném cái lỗi xuống tầng dưới thay vì sử dụng try catch
  (err, req, res, next) => {
    console.log("Error handler nè")
    res.status(400).json({ message: err.message })
  }
)

export default usersRoute
