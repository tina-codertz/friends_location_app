import type {Timestamp} from "firebase/firestore";

export type UserProfile ={
    email:string;
    username:string;
    deviceId?:string;
    createdAt:Timestamp;
    sharing:boolean;
    lat:number | null;
    lng:number | null;
    locationUpdatedAt:Timestamp | null;

};

export type FriendRequestDoc={
    fromUid: string;
    toUid:string;
    status:"pending" | "accepted" | "rejected";
    createdAt:Timestamp;
};
export type FriendshipDoc={
    memberIds:[string, string];
    createdAt:Timestamp;
};