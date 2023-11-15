import { Request, Response, NextFunction } from "express";
import formidable from "formidable";
import path from "path";
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from "~/constants/dir";
import HTTP_STATUS from "~/constants/httpStatus";
import { USERS_MESSAGES } from "~/constants/messages";
import mediasService from "~/services/medias.services";
import fs from "fs"; //thư viện giúp handle các đường dẫn
import mime from "mime";

// console.log(__dirname) //log thử để xem
// console.log(path.resolve()) //D:\toturalReact2022\nodejs-backend\ch04-tweetProject
// console.log(path.resolve('uploads')) //D:\toturalReact2022\nodejs-backend\ch04-tweetProject\uploads
//!IMAGE
export const uploadImageController = async (req: Request, res: Response) => {
  const url = await mediasService.uploadImage(req);
  return res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS,
    result: url
  });
};

//khỏi async vì có đợi gì đâu
export const serveImageController = (req: Request, res: Response, next: NextFunction) => {
  const { namefile } = req.params; //lấy namefile từ param string
  res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, namefile), (error) => {
    console.log(error); //xem lỗi trong như nào, nếu ta bỏ sai tên file / xem xong nhớ cmt lại cho đở rối terminal
    if (error) {
      return res.status((error as any).status).send("File not found");
    }
  }); //trả về file
};

//!----VIDEO
export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediasService.uploadVideo(req);
  return res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS,
    result: url
  });
};

//khỏi async vì có đợi gì đâu
// export const serveVideoController = (req: Request, res: Response, next: NextFunction) => {
//   const { namefile } = req.params; //lấy namefile từ param string
//   res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, namefile), (error) => {
//     if (error) {
//       return res.status((error as any).status).send("File not found");
//     }
//   });
// };

//TODO: ta nâng cấp hàm này từ hàm trên để phục vụ cho streaming video
export const serveVideoStreamController = (req: Request, res: Response, next: NextFunction) => {
  const { namefile } = req.params; //lấy namefile từ param string
  const range = req.headers.range; //lấy cái range trong headers
  console.log(range);

  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, namefile); //đường dẫn tới file video
  //nếu k có range thì báo lỗi, đòi liền
  if (!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send("Require range header");
  }
  //1MB = 10^6 byte (tính theo hệ 10, đây là mình thấy trên đt,UI)
  //tính theo hệ nhị là 2^20 byte (1024*1024)
  //giờ ta lấy dung lượng của video
  const videoSize = fs.statSync(videoPath).size; //ở đây tính theo byte
  //dung lượng cho mỗi phân đoạn muốn stream
  const CHUNK_SIZE = 10 ** 6; //10^6 = 1MB
  //lấy giá trị byte bắt đầu từ header range (vd: bytes=8257536-29377173/29377174)
  //8257536 là cái cần lấy
  const start = Number(range.replace(/\D/g, "")); //lấy số đầu tiên từ còn lại thay bằng ''
  console.log("start: ", start);

  //lấy giá trị byte kết thúc-tức là khúc cần load đến

  //!ta cần phải load một đoạn trước khi video nó chạy, +1 tức là +1MB
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1); //nếu (start + CHUNK_SIZE) > videoSize thì lấy videoSize
  //có 2 trường hợp: nếu start + chunk chưa vượt quá video :) thì sẽ ổn
  //nhưng nếu start + chunk size lớn hơn video thì bị lố, nên ta sẽ lập tức set end về cái vị trí cuối video

  //dung lượng sẽ load thực tế
  const contentLength = end - start + 1; //thường thì nó luôn bằng CHUNK_SIZE, nhưng nếu là phần cuối thì sẽ nhỏ hơn
  const contentType = mime.getType(videoPath) || "video/*"; //lấy kiểu file, nếu k đc thì mặc định là video/*
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`, //end-1 vì nó tính từ 0
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": contentType
  };
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers); //trả về phần nội dung
  //khai báo trong httpStatus.ts PARTIAL_CONTENT = 206: nội dung bị chia cắt nhiều đoạn
  const videoStreams = fs.createReadStream(videoPath, { start, end }); //đọc file từ start đến end
  videoStreams.pipe(res);
  //pipe: đọc file từ start đến end, sau đó ghi vào res để gữi cho client
};