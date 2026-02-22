import express, { Request, Response} from 'express';
import homeRoutes from './src/routes/homepage.route';

//mount express

const app = express();
const PORT: number = 3000;

app.use('/api',homeRoutes);

app.get('/health',(req: Request, res: Response) =>{
   res.status(200).json({message:"Server is running"});
})

app.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`);
})