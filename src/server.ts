import express from "express";
import morgan from "morgan";
import "express-async-errors";
import { getAll, getOneById, create, updateById, deliteById, createImage} from "./controllers/planets.js"
import multer from "multer";
import {logIn, signUp, logOut} from "./controllers/users"
import authorize from "./authorize.js";
import "./passport.js";


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads")
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
})
const upload = multer({ storage })
const app = express();
const port = 3000;

app.use("/uploads", express.static("uploads"))


app.use(morgan("dev"));
app.use(express.json());


app.get("/api/planets", getAll);

app.get("/api/planets/:id", getOneById);

app.post("/api/planets", create);

app.put("/api/planets/:id", updateById);

app.delete("/api/planets/:id", deliteById);

app.post("/api/planets/:id/image",upload.single("image"),createImage)

app.post("/api/users/login", logIn);

app.post("/api/users/signup", signUp);

app.post("/api/users/logout", authorize, logOut);

app.listen(port, () => {
  console.log(
    `Example app listening on port http://localhost:${port}/api/planets`
  );
});