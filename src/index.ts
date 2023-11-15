import express, { Request, Response, NextFunction } from "express";
import usersRouter from "./routes/users.routes";

// import { run } from './services/database.services'
import databaseService from "./services/database.services";
import { defaultErrorHandler } from "./middlewares/error.middlewares";
import mediasRouter from "./routes/medias.routes";
import { initFolder } from "./utils/file";
import { config } from "dotenv";
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from "./constants/dir";
import staticRouter from "./routes/static.routes";
import { MongoClient } from "mongodb";
import tweetsRouter from "./routes/tweets.routes";
config();

databaseService.connect().then(() => {
  databaseService.indexUsers();
  databaseService.indexRefreshTokens();
  databaseService.indexFollowers();
});

const app = express();

//app không hiểu mình log ra json
app.use(express.json());

//ta tách riêng userRoute, thằng chuyên quản lí các route liên quan user thành một file riêng
//* const usersRouter = express.Router()

const PORT = process.env.PORT || 4000;

// tạo folder uploads
initFolder();

// run().catch(console.dir)
databaseService.connect();

app.get("/", (req, res) => {
  res.send("Hello, đây là tầng đầu tiên API");
});

// //middleWare
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

// //tách hàm để viết các method
// usersRouter.get('/tweets', (req, res) => {
//   res.json({
//     data: [
//       { name: 'Điệp', yob: 1999 },
//       { name: 'Hùng', yob: 2003 },
//       { name: 'Được', yob: 1994 }
//     ]
//   })
// })

app.use("/users", usersRouter);
//localhost:3000/api/tweets/ test trong postman ra cục dữ liệu ở trên
//usersRouter là thằng chuyên quản lí các user

//localhost:3000/api log ra thời gian trong terminal
//

// app.use((err: any, req: Request, res: Response, next: NextFunction) => {
//   console.log("Error Handler nè")
//   // res.status(400).json({ message: err.message })
//   //không được ném 400
//   res.status(err.status).json({ message: err.message })
// })

app.use("/medias", mediasRouter);

/* // app.use(express.static(UPLOAD_IMAGE_DIR)) //static file handler
//nếu viết như vậy thì link dẫn sẽ là localhost:4000/blablabla.jpg
app.use("/static", express.static(UPLOAD_IMAGE_DIR)); //nếu muốn thêm tiền tố, ta sẽ làm thế này
//vậy thì nghĩa là vào localhost:4000/static/blablabla.jpg

databaseService.connect(); */

//TODO: Ta demo

// app.use('/static', express.static(UPLOAD_IMAGE_DIR)) //k dùng cách 1 nữa nên cmt

// app.use("/static", staticRouter); //cách 2: ta tự độ chế

// app.use("/static/video", express.static(UPLOAD_VIDEO_DIR)); //!streaming video -> fix lỗi chạy video trên chrome bằng đồ xài sẵn của express thay vì đồ tự chế

app.use("/static/video-stream", express.static(UPLOAD_VIDEO_DIR)); //!streaming video -> fix lỗi chạy video trên chrome bằng đồ xài sẵn của express thay vì đồ tự chế

app.use("/tweets", tweetsRouter); //route handler

//chạy anh quản lí lỗi
app.use(defaultErrorHandler);

//!thằng này sẽ nằm cuối ứng dụng
app.listen(PORT, () => {
  console.log(`Server đang chạy trên PORT ${PORT}`);
});
