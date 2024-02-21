import express, {Request, Response} from "express";
import path from "path";

const app = express();
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

const EXPRESS_PORT: Number = 7777;

app.get("/", (req: Request, res: Response) => {
    res.send("Hello!!!");
});

app.get("/reflected", (req: Request, res: Response) => {
    const keyword = req.query.keyword as String | undefined;
    res.render("reflectedXss", {keyword});
})

app.listen(EXPRESS_PORT, () => {
    console.log(`Server Started... Port: ${EXPRESS_PORT}`);
});