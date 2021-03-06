import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateAccountInput } from "./dtos/create-account.dto";
import { LoginInput } from "./dtos/login.dto";
import { User } from "./entities/user.entity";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "src/jwt/jwt.service";
import { EditProfileInput } from "./dtos/edit-profile.dto";
import { Verification } from "./entities/verification.entity";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private readonly users: Repository<User>,
        @InjectRepository(Verification) private readonly verifications: Repository<Verification>,
        private readonly jwtService: JwtService,
    ) {}

    async createAccount({email, password, role}: CreateAccountInput): Promise<{ok: boolean, error?: string}> {
        try {
            const exists = await this.users.findOne({email});
            if(exists){
                return {ok: false, error: "There is a user with that email already"};
            }
            const user = await this.users.save(this.users.create({email, password, role}));
            await this.verifications.save(this.verifications.create({
                code: "Verification Code",
                user
            }));
            return {ok: true};
        } catch(e) {
            return {ok: false, error: "Couldn't create account"};
        }
    }

    async login({email, password}: LoginInput): Promise<{ok: boolean, error?: string, token?: string}> {
        try{
            const user = await this.users.findOne({email});
            if(!user){
                return {
                    ok: false,
                    error: "User not found"
                };
            }
            const passwordCorrect = await user.checkPassword(password);
            if(!passwordCorrect){
                return {
                    ok: false,
                    error: "Wrong password",
                }
            }
            const token = this.jwtService.sign(user.id);
            return {
                ok: true,
                token,
            }
        } catch(error){
            return {
                ok: false,
                error
            }
        }
        return;
    }

    async findById(id: number): Promise<User> {
        return this.users.findOne({id});
    }

    async editProfile(userId: number, {email, password}: EditProfileInput): Promise<User>{
        const user = await this.users.findOne(userId);
        if(email) {
            user.email = email;
        }
        if(password) {
            user.password = password;
        } 
        return this.users.save(user);
    }
} 