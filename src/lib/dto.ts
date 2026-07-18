// Plain serializable shapes passed from Server Components into Client Components
// (Prisma Decimal and Date are converted to number / ISO string).

export type CategoryDTO = {
  id: string;
  name: string;
  defaultPricePerHour: number;
  sortOrder: number;
  placesCount: number;
};

export type RoomDTO = {
  id: string;
  name: string;
  description: string | null;
  placesCount: number;
};

export type PlaceDTO = {
  id: string;
  name: string;
  type: "SEAT" | "ROOM_UNIT";
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  pricePerHour: number;
  categoryId: string;
  categoryName: string;
  roomId: string | null;
  roomName: string | null;
};

export type ClientDTO = {
  id: string;
  name: string;
  phone: string;
  bookingsCount: number;
  createdAt: string;
  balance: number;
  email: string | null;
};

export type BalanceTransactionDTO = {
  id: string;
  type: "TOPUP_ADMIN" | "BOOKING_CHARGE" | "BOOKING_REFUND";
  amount: number;
  note: string | null;
  createdAt: string;
};

export type BookingSnackDTO = {
  id: string;
  name: string;
  quantity: number;
  priceSnapshot: number;
};

export type BookingDTO = {
  id: string;
  placeId: string;
  placeName: string;
  roomName: string | null;
  categoryName: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  startsAt: string;
  endsAt: string;
  totalPrice: number;
  status: "ACTIVE" | "CANCELLED";
  source: "CLIENT" | "ADMIN";
  cancelReason: string | null;
  snacks: BookingSnackDTO[];
};

export type SnackDTO = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isAvailable: boolean;
  sortOrder: number;
};

export type ClubDTO = {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string | null;
  description: string | null;
  imageUrl: string | null;
  rating: number | null;
  status: "ACTIVE" | "COMING_SOON";
  isMain: boolean;
  sortOrder: number;
};
