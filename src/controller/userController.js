const usersModel = require("../model/usersModel")
const jwt = require('jsonwebtoken');
const {isValid, nameRegex ,mailRegex,regexNumber ,regexPin,passRegex} = require('../validation/validation')



// user Register APi
const registerUser = async function (req, res) {
    try {
        const {title , name ,phone ,email ,password,address } = req.body
      
        if (Object.keys(req.body).length == 0) return res.status(400).send({ status: false, message: 'Please enter details for user registration.' })

        if (!title) return res.status(400).send({ status: false, msg: "Title is required for user registration." })

        if (!(["Mr", "Mrs", "Miss"].indexOf(title) !== -1)) {
            return res.status(400).send({ status: false, msg: "Title should be from these options only- Mr, Mrs, Miss" })
        }

        if (!(name && isValid(name))) return res.status(400).send({ status: false, msg: 'Name is required for user registration.' })

        if (!(nameRegex.test(name))) return res.status(400).send({ status: false, msg: 'Please enter valid characters only in name.' })

        if (!phone) return res.status(400).send({ status: false, msg: 'Phone number is required for user registration.' })

        if (!isValid(phone)) return res.status(400).send({ status: false, msg: "Phone number can't be blank or without strig." })
        
        if (!(regexNumber.test(phone))) return res.status(400).send({ status: false, msg: "Mobile Number must 10 digit only." })

        let phoneCheck = await usersModel.findOne({ phone: phone })
        if (phoneCheck) return res.status(400).send({ status: false, msg: "This phone number is already registered." })

        if (!email) return res.status(400).send({ status: false, msg: "Email is required for user registration." })
        
        if (!(mailRegex.test(email))) return res.status(400).send({ status: false, msg: 'Please enter valid email id to register.' })

        let mailCheck = await usersModel.findOne({ email: email })
        if (mailCheck) return res.status(400).send({ status: false, msg: "This email is already registered." })

        if (!password) return res.status(400).send({ status: false, msg: 'Password is required for privacy.' })

        if (!(passRegex.test(password))) return res.status(400).send({ msg: "Please enter a password which contains min 8 and maximum 15 letters,upper and lower case letters and a number" })

        if(Array.isArray(address) )  return res.status(400).send({ status: false, msg: " address is in Object format." })

        if (!isValid(address.city )) return res.status(400).send({ status: false, msg: "Please enter city." })
        
        if (!isValid( address.pincode)) return res.status(400).send({ status: false, msg: "Please enter pincode " })
        
        if (!isValid(address.street)) return res.status(400).send({ status: false, msg: " Enter proper street name." })
        
        if (address.city) {
            if (!nameRegex.test(address.city)) return res.status(400).send({ status: false, msg: "Please enter city in alphabet" })
        }
        if (address.pincode) {
            if (!regexPin.test(address.pincode)) return res.status(400).send({ status: false, msg: "Please enter pincode in number or only 6 digit" })
        }
        let registerNow = await usersModel.create(req.body)
        res.status(201).send({ status: true, data: registerNow })
    }
    catch (err) {res.status(500).send({ status: false, msg: err.message })}
}

// Login
const login = async (req, res) => {

    try {
        const { email, password } = req.body;

        if (!email || !password) return res.status(400).send({ status: false, message: "Please Fill All Required* Fields" });

        if (!mailRegex.test(email)) return res.status(400).send({ status: false, message: "Please fill a valid emailId " })

        const isUser = await usersModel.findOne({ email });

        if (!isUser) return res.status(404).send({ status: false, message: "User Not Register" });

        if (isUser.password !== password) return res.status(401).send({ status: false, message: "Invalid Login Credentials" });

        const token = jwt.sign({ _id: isUser._id }, "sourabhsubhamgauravhurshalltemsnameproject3", { expiresIn: "1d" });
        
        res.setHeader("x-api-key", token)    
        return res.status(200).send({ status: true, message: "Login Successful", data: { token } });

    } catch (error) { return res.status(500).send({ status: false, message: error.message }) }

}

module.exports = { registerUser, login }