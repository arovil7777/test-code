import express, { Request, Response } from "express";
import { join } from "path";

const app = express();
app.use(express.json());

app.use(express.static(join(__dirname, "public")));

const EXPRESS_PORT: Number = 7777;

app.get("/", (req: Request, res: Response) => {
    res.sendFile(importHTML("domBasedXss.html"));
});

app.get("/first", (req: Request, res: Response) => {
    res.sendFile(importHTML("firstPage.html"));
});

app.get("/second", (req: Request, res: Response) => {
    res.sendFile(importHTML("secondPage.html"));
});

app.listen(EXPRESS_PORT, () => {
    console.log(`Server Started... Port: ${EXPRESS_PORT}`);
});

function importHTML(fileName: string) {
    return join(__dirname, "../public", fileName);
}