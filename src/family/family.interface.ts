import { Gender } from "src/models/member.entity";


export interface FamilyResponse {
    id: string;
    fullname: string;
    nickname: string;
    gender:Gender;
    domicile: string | null;
    depth: number | null;
    birthDate: Date;
    deathDate: Date | null;
    photoUrl: string | null;
    spouseId: string | null;
    parentIds: string[];
    childrenIds: string[];
}