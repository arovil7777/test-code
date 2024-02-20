import express, {Request, Response} from "express";

const app = express();
app.use(express.json());

const EXPRESS_PORT: Number = 7777;

app.get("/", (req: Request, res: Response) => {
    res.send("Hello!!!");
});

app.listen(EXPRESS_PORT, () => {
    console.log(`Server Started... Port: ${EXPRESS_PORT}`);
});