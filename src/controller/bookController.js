const bookModel = require("../model/booksModel")
const reviewsModel = require('../model/reviewsModel')
const mongoose = require('mongoose')
const userModel = require("../model/usersModel")
const {isValid,titleregEx,regEx,isbnregEx,Dateregex} = require('../validation/validation');
const { uploadFile } = require("../aws/uploadFile");






// CREATE BOOK
const createBooks = async function (req, res) {
    try {
      
        const { title, excerpt, userId, ISBN, category, subcategory, releasedAt } = req.body

        let uploadedFileURL;
        let files= req.files
        if(files && files.length>0){
            uploadedFileURL = await uploadFile( files[0] )
        }

        // fiest check data is pressent in body or not?
        if (Object.keys(req.body).length == 0) return res.status(400).send({ status: false, message: "Please Enter the Data in Request Body" })

        if (!userId) return res.status(400).send({ status: false, message: 'Please enter userId ' })
        
        if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, message: 'Please enter valid userId ' })
        
        //  authorization
        if (req.userDetail._id !== userId) return res.status(403).send({ status: false, message: " User unauthorised " })

        // title is present or not?
        if (!title) return res.status(400).send({ status: false, message: "Please Enter the Title" });
        if (!titleregEx.test(title)) return res.status(400).send({ status: false, message: "title text is invalid" });


        // excerpt is present or not?
        if (!excerpt) return res.status(400).send({ status: false, message: "Please Enter the excerpt" });
        if (!regEx.test(excerpt)) return res.status(400).send({ status: false, message: "excerpt text is invalid it must be alphabet " });

        //check if userId is present in Db or Not ? 
        let user = await userModel.findById(userId)
        if (!user) return res.status(404).send({ status: false, message: "This userId is not present in User DB" })

        // ISBN is present or not?
        if (!ISBN) return res.status(400).send({ status: false, message: "Please Enter the ISBN" });
        if (!isbnregEx.test(ISBN)) return res.status(400).send({ status: false, message: "Please Enter the valid ISBN its contain only 13 Number" + "Ex. 978-1-4008-8462-6, 978-1-4028-9462-6" });
        
        // category is present or not?
        if (!category) return res.status(400).send({ status: false, message: "Please Enter the category" });
        if (!regEx.test(category)) return res.status(400).send({ status: false, message: "category text is invalid it must be alphabet " });

        // subcategory is present or not?
        if (!subcategory) return res.status(400).send({ status: false, message: "Please Enter the subcategory" });
        if (!regEx.test(subcategory)) return res.status(400).send({ status: false, message: "subcategory text is invalid it must be alphabet " });

        // releasedAt is present or not?
        if (!releasedAt) return res.status(400).send({ status: false, message: "Please Enter the releasedAt" });
        if (!Dateregex.test(releasedAt)) return res.status(400).send({ status: false, message: "Date is invalid it must be yyyy-MM-dd " });

        const TitleName = await bookModel.findOne({ title })
        if (TitleName) return res.status(400).send({ status: false, message: "Title must be unique" })

        const isbnnum = await bookModel.findOne({ ISBN })
        if (isbnnum) return res.status(400).send({ status: false, message: "ISBN must be unique" })

        req.body.bookCover = uploadedFileURL
        let data = await bookModel.create(req.body)
        return res.status(201).send({ status: true, message: 'Success', data: data })

    } catch (error){ return res.status(500).send({ status: false, message: error.message })};
    
}

// GET ALL QUERY BOOK
const getBook = async function (req, res) {
    try {

        let { userId, category, subcategory, ...ab } = req.query

        if (Object.keys(ab).length > 0) return res.status(400).send({ status: false, message: 'Cannot filter this Query' })

        if (category) {
            if (!isValid(category)) return res.status(400).send({ status: false, message: 'Invalid Category' })
        }

        if (subcategory) {
            if (!isValid(subcategory)) return res.status(400).send({ status: false, message: 'Invalid subcategory' })
        }

        if (userId) {
            if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, msg: 'Please enter valid userId' })
        }

        const findBook = await bookModel.find({ $and: [req.query, { isDeleted: false }] }).select({ title: 1, excerpt: 1, userId: 1, category: 1, releasedAt: 1, reviews: 1 }).populate('userId')

        findBook.sort((a,b)=>a.title.localeCompare(b.title))

        if (!findBook.length) return res.status(404).send({ status: false, message: 'Book is Not found' })

        return res.status(200).send({ status: false, message: 'All Book Successfull', data: findBook })

    } catch (err) {res.status(500).send({ status: false, message: err.message })}
}

// GET BOOK DETAIL BY PATH PARAMS
const getBookbyparams = async (req, res) => {
    try {

        const bookId = req.params.bookId;

        if (!mongoose.isValidObjectId(bookId)) return res.status(400).send({ status: false, message: "Please Enter valid BookId" });

        const bookDetails = await bookModel.findById(bookId);

        if (!bookDetails || (bookDetails.isDeleted === true)) return res.status(404).send({ status: false, message: "Book Details is Not Present in Our Database." });

        const reviews = await reviewsModel.find({ bookId, isDeleted: false });

        return res.status(200).send({ status: true, message: "Books Details", data: bookDetails, reviews });

    } catch (error) { return res.status(500).send({ status: false, message: error.message }) }
}

// UPDATE BOOK
const updateBook = async function (req, res) {
    try {
        let id = req.params.bookId

        let { title, excerpt, ISBN, releasedAt, ...ab } = req.body   

        if (Object.keys(ab).length > 0) return res.status(400).send({ status: false, message: 'Cannot update this detail ' })

        let book = await bookModel.findOne({ _id: id, isDeleted: false });

        if (!book) return res.status(404).send({ status: false, msg: 'No such book found.' });

        if (Object.keys(req.body).length == 0) return res.status(400).send({ status: false, message: "Please enter data for updation." })
        
        if (title) {
            if (!isValid(title)) return res.status(400).send({ status: false, msg: "Please enter valid title" })
        }

        if (excerpt) {
            if (!isValid(excerpt))  return res.status(400).send({ status: false, msg: "Please enter valid excerpt" })
        }
        if (ISBN) {
            if (!isbnregEx.test(ISBN)) return res.status(400).send({ status: false, message: "Please Enter the valid ISBN its contain only 13 Number" + "Ex. 978-1-4008-8462-6, 978-1-4028-9462-6" });
        }
        if (releasedAt) {
            if (!Dateregex.test(releasedAt)) return res.status(400).send({ status: false, message: "Date is invalid it must be yyyy-MM-dd " });
        }

        // DB call
        let checkISBN = await bookModel.findOne({ ISBN: req.body.ISBN })
        if (checkISBN) return res.status(400).send({ status: false, msg: "This ISBN already exists, try new." })

        let checkTitle = await bookModel.findOne({ title: req.body.title })
        if (checkTitle) return res.status(400).send({ status: false, msg: "This title already exists, try new." })
        
        let updatedBook = await bookModel.findOneAndUpdate({ _id: id }, req.body, { new: true });
        return res.status(200).send({ status: true, data: updatedBook });

    }
    catch (err) {res.status(500).send({status:false, message: err.message })}
}

// DELETE BY BOOKID
const deletebookbyid = async (req, res) => {
    try {
        const bookId = req.params.bookId;

        if (!mongoose.isValidObjectId(bookId)) return res.status(400).send({ status: false, msg: 'Please enter valid bookId' })

        let book = await bookModel.findById(bookId)

        if (!book || book.isDeleted === true) return res.status(404).send({ status: false, message: "book is not found" })

        await bookModel.findOneAndUpdate({ _id: bookId }, { isDeleted: true, deletedAt: new Date() }, { new: true });
        return res.status(200).send({ status: true, message: "successfuly Deleted", });

    } catch (error) { return res.status(500).send({ status: false, message: error.message }) }
}


module.exports = { createBooks, getBook, getBookbyparams, updateBook, deletebookbyid }




