// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // When true the app uses in-memory / localStorage mock data.
  // Set to false to enable real backend HttpClient calls (implement endpoints in services).
  useMock: false
  ,
  // Optional backend base URL. When empty, relative URLs are used.
  apiBaseUrl: '',

  googleSheetsApiUrl: 'https://script.google.com/macros/s/AKfycbyfvWO7iYWTWApJy7fAKX_Nvc5LCnTOZOEiCOzNL28QZzK_2oWN-XJpWeqNHYDKYF3tuQ/exec',
  googleSheetsApiKey: 'ABUBAKARSADEEQSULEIMAN'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
