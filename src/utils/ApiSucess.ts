// @desc Structures data from success with more relevant data
export class ApiSuccess<T> {
    success: boolean = true;
    message?: string;
    data: T | T[];
 
    constructor(data: T, message: string) {
       this.data = data;
 
       if (message) {
          this.message = message;
       }
    }
 }