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
usersRoute.post("/register", registerValidator, registerController)

//!khi gặp lỗi ta không được throw ra, phải dồn tất cả lỗi về Error Handler
//bổ sung next cho hàm đó
//nếu hàm đó là async ta sẽ xài try-catch cho async (next(error))

//ta sẽ đặt hàm xử lí lỗi này ở trên app tổng, đảm bảo tính reuse của nó cho toàn hệ thống

export default usersRoute
