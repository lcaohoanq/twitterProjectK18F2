import { NextFunction, Request, Response } from "express"
import { omit } from "lodash"
import HTTP_STATUS from "~/constants/httpStatus"

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  //err là lỗi từ các nơi khác truyền xuống, ta không thể tránh khỏi việc lỗi bị thiếu prop (status|message)
  //không chuẩn theo í mình

  //ta đã quy ước lỗi phải là 1 object có 2 thuộc tính: status và message

  //json({message: err.message}), lỗi các nơi đổ về, có lúc sẽ không có thuộc tính message -> undefined
  res.status(err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(omit(err, ["status"]))
}
