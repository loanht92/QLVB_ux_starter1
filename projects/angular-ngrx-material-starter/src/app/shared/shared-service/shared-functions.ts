import { SharedService } from './shared.service';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';

export interface currentUserObject {
    userId: Number;
    userName: string;
    userEmail: string;
    userLogin: string;
    isSiteAdmin: Boolean;
    isVT: Boolean;
    isNV: Boolean;
}

@Injectable({
    providedIn: 'root',
})
export class ShareFunction {
    currentUser: currentUserObject;
    public isVanThu: Boolean;
    public isNhanVien: Boolean;

    constructor(private shareService: SharedService) {
        //this.getUserCurrent();
    }

    getUserCurrent() {
        this.shareService.getCurrentUser().subscribe(
            itemValue => {
                this.currentUser = {
                    userId: itemValue["Id"],
                    userName: itemValue["Title"],
                    userEmail: itemValue["Email"],
                    userLogin: itemValue["LoginName"],
                    isSiteAdmin: itemValue["IsSiteAdmin"],
                    isNV: false,
                    isVT: false
                }

            },
            error => console.log("error: " + error),
            () => {
                console.log("Load user infor: " + this.currentUser);
                this.shareService.getRoleCurrentUser(this.currentUser.userId).subscribe(
                    itemValue => {
                        let itemUserMember = itemValue['value'] as Array<any>;
                        itemUserMember.forEach(element => {
                            if(element.RoleCode === "VT") {
                                this.currentUser.isVT = true;
                                this.isVanThu = true;
                            }
                            if(element.RoleCode === "NV") {
                                this.currentUser.isNV = true;
                                this.isNhanVien = true;
                            }
                        })
                    },
                    error => console.log("Get role user error: " + error),
                    () => {
                        console.log("Get role user success");                        
                    })
            }
        );
    }
}