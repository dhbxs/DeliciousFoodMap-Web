// 高德地图API类型声明
declare global {
  interface Window {
    AMap: typeof AMap;
  }
}

declare namespace AMap {
  class Map {
    constructor(container: string | HTMLElement, options?: MapOptions);
    setCenter(center: LngLat | [number, number]): void;
    getCenter(): LngLat;
    setZoom(zoom: number): void;
    getZoom(): number;
    add(overlays: any | any[]): void;
    remove(overlays: any | any[]): void;
    destroy(): void;
    on(event: string, handler: Function): void;
    off(event: string, handler: Function): void;
    addControl(control: any): void;
    removeControl(control: any): void;
  }

  interface MapOptions {
    center?: [number, number];
    zoom?: number;
    mapStyle?: string;
    viewMode?: string;
    lang?: string;
  }

  class LngLat {
    constructor(lng: number, lat: number);
    lng: number;
    lat: number;
  }

  class Pixel {
    constructor(x: number, y: number);
    x: number;
    y: number;
  }

  class Marker {
    constructor(options?: MarkerOptions);
    setPosition(position: LngLat | [number, number]): void;
    getPosition(): LngLat;
    setContent(content: string | HTMLElement): void;
    on(event: string, handler: Function): void;
    off(event: string, handler: Function): void;
  }

  interface MarkerOptions {
    position?: LngLat | [number, number];
    content?: string | HTMLElement;
    offset?: Pixel;
    anchor?: string;
  }

  class InfoWindow {
    constructor(options?: InfoWindowOptions);
    open(map: Map, position: LngLat | [number, number]): void;
    close(): void;
    setContent(content: string | HTMLElement): void;
  }

  interface InfoWindowOptions {
    content?: string | HTMLElement;
    offset?: Pixel;
    position?: LngLat | [number, number];
  }

  class Scale {
    constructor(options?: any);
  }

  class ToolBar {
    constructor(options?: any);
  }

  class ControlBar {
    constructor(options?: any);
  }

  class Geolocation {
    constructor(options?: GeolocationOptions);
    getCurrentPosition(callback: (status: string, result: any) => void): void;
  }

  interface GeolocationOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
    convert?: boolean;
    showButton?: boolean;
    buttonPosition?: string;
    showMarker?: boolean;
    showCircle?: boolean;
    panToLocation?: boolean;
    zoomToAccuracy?: boolean;
  }

  function plugin(name: string | string[], callback: () => void): void;

  interface MapEvent {
    lnglat: LngLat;
    pixel: Pixel;
    type: string;
  }
}

export {};
