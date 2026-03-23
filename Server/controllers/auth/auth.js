import User from '../../models/User.js';
import { StatusCodes } from 'http-status-codes';
import { BadRequestError, NotFoundError, UnauthenticatedError } from '../../errors/index.js';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';


const register = async ( req, res ) =>
{
    const { email, password, register_token } = req.body;
    if ( !email || !password || !register_token )
    {
        throw new BadRequestError( "Please provide all values !" );
    }
    const user = await User.findOne( { email } );
    if ( user )
    {
        throw new BadRequestError( "User already exits" );

    }

    try
    {
        const payload = jwt.verify( register_token, process.env.REGISTER_SECRET );
        if ( payload.email !== email )
        {
            throw new BadRequestError( 'Invalid register token' );
        }

        const newUser = new User.create( { email, password } );
        const access_token = newUser.createAccessToken();
        const refresh_token = newUser.createRefreshToken();
        res.status( StatusCodes.CREATED ).json( { user: { email: newUser.email, userId: newUser.id }, token: { access_token, refresh_token } } );
    } catch ( error )
    {
        console.log( error );
        throw new BadRequestError( 'Invalid Body' );
    }
};

const login = async ( req, res ) =>
{
    const { email, password } = req.body;
    if ( !email || !password )
    {
        throw new BadRequestError( "Please provide all values !" );

    }
    const user = await User.findOne( { email } );
    if ( !user )
    {
        throw new BadRequestError( "Invalid Credentials" );

    }
    const isPasswordCorrect = await user.comparePassword( password );
    if ( !isPasswordCorrect )
    {
        let message;
        if ( user.blocked_until_password && user.blocked_until_password > new Date() )
        {
            const remainingMinutes = Math.ceil( ( user.blocked_until_password - new Date() ) / 60000 );
            message = `Your Account is blocked for password. Please try again after ${ remainingMinutes } minutes(s).`;
        } else
        {
            const attemptsRemaining = 3 - user.wrong_password_attempts;
            message = attemptsRemaining > 0 ? `Invalid password, ${ attemptsRemaining } attempts remaining` : "Invalid login attempts exceeded. Please try after 30 minutes.";
        }

        throw new UnauthenticatedError( message );
    }
    const access_token = user.createAccessToken();
    const refresh_token = user.createRefreshToken();

    let phone_exist = false;
    let login_pin_exist = false;

    if ( user.phone_number )
    {
        phone_exist = true;
    }

    if ( user.login_pin_exist )
    {
        login_pin_exist = true;
    }

    res.status( StatusCodes.OK ).json( {
        user: { name: user.name, email: user.email, userId: user._id, phone_exist, login_pin_exist },
        token: { access_token, refresh_token }
    } );

};


const refreshToken = async ( req, res ) =>
{
    const { type, refresh_Token } = req.body;
    if ( !type || ![ "socket", "app" ].includes( type ) || !refresh_Token )
    {
        throw new BadRequestError( "Invalid body" );

    }
    try
    {
        let accessToken, newRefreshToken;
        if ( type === "app" )
        {
            ( { accessToken, newRefreshToken } = await generateRefreshTokens(
                refresh_Token,
                process.env.REFRESH_SECRET,
                process.env.REFRESH_EXPIRY,
                process.env.ACCESS_SECRET,
                process.env.ACCESS_EXPIRY,

            ) );

        } else if ( type === "socket" )
        {
            ( { accessToken, newRefreshToken } = await generateRefreshTokens(
                refresh_Token,
                process.env.SOCKET.REFRESH_SECRET,
                process.env.SOCKET.REFRESH_EXPIRY,
                process.env.SOCKET.ACCESS_SECRET,
                process.env.SOCKET.ACCESS_EXPIRY,
            ) );
        }
        res.status( StatusCodes.OK ).json( { access_Token: accessToken, refresh_Token: newRefreshToken } );

    } catch ( error )
    {
        console.error( error );
        throw new UnauthenticatedError( "Invalid Token" );
    }
};

async function generateRefreshTokens (
    token,
    refresh_secret,
    refresh_expiry,
    access_secret,
    access_expiry

)
{
    try
    {
        const payload = jwt.verify( token, refresh_secret );
        const user = await User.findById( payload.userId );
        if ( !user )
        {
            throw new NotFoundError( "User not found" );
        }
        const access_token = jwt.sign(
            { userId: payload.userId },
            access_secret,
            { expiresIn: access_expiry }
        );
        const newRefreshToken = jwt.sign(
            { userId: payload.userId },
            refresh_secret,
            { expiresIn: refresh_expiry }
        );
        return { access_token, newRefreshToken };

    } catch ( error )
    {
        console.log( "Genarate Refresh Token", error );
        throw new UnauthenticatedError( "Invalid Token" );
    }
}

const logout = async ( res, req ) =>
{
    const accessToken = req.headers.authorization.split( " " )[ 1 ];
    const decodedToken = jwt.decode( accessToken, process.env.JWT_SECRET );
    const userId = decodedToken.userId;
    await User.updateOne( ( { _id: userId }, { $unset: { biometricKey: 1 } } ) );
    res.status( StatusCodes.OK ).json( { message: "Logged out successfully" } );
};

export { register, login, refreshToken, logout }




