export type UUID = string;
export type ISODate = string; // ISO 8601 format
export type CurrencyCode = string; // e.g. "USD"

export interface BaseEntity {
    id: UUID;
    createdAt: ISODate;
    updatedAt: ISODate;
    isDeleted: boolean;
}
