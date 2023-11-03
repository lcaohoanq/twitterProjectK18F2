import { Request, Response, NextFunction, RequestHandler } from "express"

//hàm này có chức năng nhận vào những hàm chưa có cấu trúc try-catch
//hàm này trả về hàm nó nhận vào với cấu trúc try-catch
//tránh lặp code nhiều khi xử lí lỗi từng chỗ

//định nghĩa thêm một kiểu dữ liệu tên là P -> Param
export const wrapAsync = <P>(func: RequestHandler<P>) => {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
