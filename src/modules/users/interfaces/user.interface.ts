export interface ILandlordProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dni: string;
  address: string;
  propertiesCount: number;
  profilePicture?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationSettings {
  receiveNewRequests: boolean;
  receiveNewMessages: boolean;
  notifyTour360View: boolean;
}

export interface IAppPreferences {
  language: string;
  timezone: string;
}

export interface ILandlordSettings {
  notificationSettings: INotificationSettings;
  appPreferences: IAppPreferences;
}

export interface IRegistrationStatus {
  isComplete: boolean;
  missingFields: string[];
}
