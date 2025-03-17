import { User } from '../models/index.js';
import { signToken, AuthenticationError } from '../services/auth.js';

// Define types for the arguments
interface AddUserArgs {
    input: {
        username: string;
        email: string;
        password: string;
    }
}

interface LoginUserArgs {
    email: string;
    password: string;
}

interface AddBooksArgs {
    bookData: {
        authors: []
        description: String
        title: String
        image: String
        link: String
    }
}


const resolvers = {
    Query: {
        me: async (_parent: any, _args: unknown, context: any) => {
            if (context.user) {
                return User.findOne({ _id: context.user._id }).populate('savedBooks');
            }
            throw new AuthenticationError('Could not authenticate user.');
        },

    },
    Mutation: {
        addUser: async (_parent: any, { input }: AddUserArgs) => {
            const user = await User.create({ ...input });

            const token = signToken(user.username, user.email, user._id);

            return { token, user };
        },
        login: async (_parent: any, { email, password }: LoginUserArgs) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('Could not authenticate user.');
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Could not authenticate user.');
            }

            const token = signToken(user.username, user.email, user._id);

            return { token, user };
        },
    },
    saveBook: async (_parent: any, { bookData }: AddBooksArgs, context: any) => {
        if (context.user) {
            return User.findByIdAndUpdate(
                context.user._id ,
                { $addToSet: { savedBooks: bookData } },
                { new: true, runValidators: true }
            );

        }
        throw AuthenticationError;
        ('You need to be logged in!');
    },
    
    removeBook: async (_parent: any, { bookId }: { bookId: string }, context: any) => {
        if (context.user) {
            return User.findOneAndUpdate(
                { _id: context.user._id },
                { $pull: { savedBooks: { bookId } } },
                { new: true }
            );

        } 
                throw AuthenticationError;
    },

}

export default resolvers;
