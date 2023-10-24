import { Request, Response, NextFunction } from "express"
import { body, validationResult, ValidationChain } from "express-validator"

//import chay
import { RunnableValidationChains } from "express-validator/src/middlewares/schema"

// can be reused by many routes

// sequential processing, stops running validations chain if the previous one fails.
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  //!khi mà ai đó gọi validate này sẽ nhận được một middlewares
  //! ta bỏ checkSchema vào validate
  //middleware này sẽ lưu lỗi vào request
  return async (req: Request, res: Response, next: NextFunction) => {
    //đi qua từng cái check lỗi
    //và lưu đến req, lấy ra bằng cách validationResult
    await validation.run(req)
    //hàm run trả ra một Promise

    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
      //không có lỗi thì sẽ đi tiếp đến controller
    }

    //lỗi với map khác gì mapped :)
    res.status(400).json({ errors: errors.mapped() })
  }
}
