//mã hoá theo chuẩn SHA256
import { createHash } from "crypto"

import { config } from "dotenv"
config()

//tạo 1 hàm nhận vào chuỗi để mã hoá theo chuẩn SHA256
function sha256(content: string) {
  return createHash("sha256").update(content).digest("hex")
}

export function hashPassword(password: string) {
  return sha256(password + process.env.PASSWORD_SECRET)
}
