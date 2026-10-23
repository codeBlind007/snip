from pydantic import BaseModel, EmailStr, Field

class SignupRequest(BaseModel):
    email_id: EmailStr
    fullname: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=8, max_length=128)
    

class UserResponse(BaseModel):
    id: int
    email_id: EmailStr
    fullname: str

    model_config = {
        "from_attributes": True,
    }
        

class SignupResponse(BaseModel):
    user: UserResponse