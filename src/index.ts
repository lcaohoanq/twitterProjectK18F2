import express, { Request, Response, NextFunction } from "express"
import usersRoute from "./routes/users.routes"

// import { run } from './services/database.services'
import databaseService from "./services/database.services"
databaseService.connect()

const app = express()

//app không hiểu mình log ra json
app.use(express.json())

//ta tách riêng userRoute, thằng chuyên quản lí các route liên quan user thành một file riêng
//* const usersRoute = express.Router()

const PORT = 3000

// run().catch(console.dir)
databaseService.connect()

app.get("/", (req, res) => {
  res.send("Hello, đây là tầng đầu tiên API")
})

// //middleWare
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

// //tách hàm để viết các method
// usersRoute.get('/tweets', (req, res) => {
//   res.json({
//     data: [
//       { name: 'Điệp', yob: 1999 },
//       { name: 'Hùng', yob: 2003 },
//       { name: 'Được', yob: 1994 }
//     ]
//   })
// })

app.use("/users", usersRoute)
//localhost:3000/api/tweets/ test trong postman ra cục dữ liệu ở trên
//usersRoute là thằng chuyên quản lí các user

//localhost:3000/api log ra thời gian trong terminal
//

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log("Error Handler nè")
  res.status(400).json({ message: err.message })
})

//!thằng này sẽ nằm cuối ứng dụng
app.listen(PORT, () => {
  console.log(`Server đang chạy trên PORT ${PORT}`)
})
