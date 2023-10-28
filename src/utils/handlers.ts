import { Request, Response, NextFunction, RequestHandler } from "express"

//hàm này có chức năng nhận vào những hàm chưa có cấu trúc try-catch
//hàm này trả về hàm nó nhận vào với cấu trúc try-catch
//tránh lặp code nhiều khi xử lí lỗi từng chỗ
export const wrapAsync = (func: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
