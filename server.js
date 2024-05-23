const express=require('express')
const mongoose=require('mongoose')
const dotenv=require('dotenv');
// const urlRoutes = require('./routes/urlRoutes');

const cors = require('cors'); 

dotenv.config();

const app = express();

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors());


app.get('/', (req, res) => {
    res.send('Hello');
  });


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

mongoose.connect(process.env.MONGODB_URI).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));