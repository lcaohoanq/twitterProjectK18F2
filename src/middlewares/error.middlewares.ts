import { NextFunction, Request, Response } from "express";
import { omit } from "lodash";
import HTTP_STATUS from "~/constants/httpStatus";
import { ErrorWithStatus } from "~/models/Errors";

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  //!err là lỗi từ các nơi khác truyền xuống, ta không thể tránh khỏi việc lỗi bị thiếu prop (status|message)
  //không chuẩn theo í mình

  //ta đã quy ước lỗi phải là 1 object có 2 thuộc tính: status và message

  //json({message: err.message}), lỗi các nơi đổ về, có lúc sẽ không có thuộc tính message -> undefined
  // res.status(err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(omit(err, ["status"]))
  //omit dùng để xoá các thuộc tính của object

  //ta xử lí như này với các loại lỗi throw new Error(), (không có status)
  if (err instanceof ErrorWithStatus) {
    //vì cái lỗi được tạo từ ErorWith Status thì nó sẽ luôn có status, nên ta bỏ đi check lỗi 500
    return res.status(err.status).json(omit(err, ["status"]));
  }
  //nếu không lọt vào if ở trên thì tức là error này là lỗi mặc định
  //name, message, stack: mà 3 thằng này có enumerable = false

  //*ta cần chuyển chúng thành true

  //ta được một mảng chứa 3 phần tử, rồi mới đem đi duyệt for
  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true });
  });
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfor: omit(err, ["stack"])
  });
};
