export class API {

  invokeImpl: (ptr: i32, size: i32) => i32;
  allocateImpl: (size: i32) => i32;
  deallocateImpl: (ptr: i32, size: i32) => void;
  storeImpl: (ptr: i32, byte: u8) => void;
  loadImpl: (ptr: i32) => u8;

  constructor(
      invokeImpl: (ptr: i32, size: i32) => i32,
      allocateImpl: (size: i32) => i32,
      deallocateImpl: (ptr: i32, size: i32) => void,
      storeImpl: (ptr: i32, byte: u8) => void,
      loadImpl: (ptr: i32) => u8
  ) {
    this.invokeImpl = invokeImpl;
    this.allocateImpl = allocateImpl;
    this.deallocateImpl = deallocateImpl;
    this.storeImpl = storeImpl;
    this.loadImpl = loadImpl;
  }

  invoke(ptr: i32, size: i32): i32 {
    return this.invokeImpl(ptr, size);
  }

  allocate(size: i32) :i32 {
    return this.allocateImpl(size);
  }

  deallocate(ptr: i32, size: i32): void {
    this.deallocateImpl(size, size);
  }

  store(ptr: i32, byte: u8): void {
    this.storeImpl(ptr, byte);
  }

  load(ptr: i32): u8 {
    return this.loadImpl(ptr);
  }
}

export class ByteInvoke {

  api: API;

  constructor(api: API) {
    this.api = api;
  }

  getBytes(remotePtr: i32): Uint8Array {
    let lenBytes: u8[] = new Array(4);
    for (let i = 0; i < 4; i++) {
      lenBytes[i] = this.api.load(remotePtr + i);
    }

    let resultLen: i32 = 0;

    for (let i = 0; i < 4; i++) {
      resultLen = resultLen | (lenBytes[i] << (8*(i - 4) as u8))
    }

    let resultBytes = new Uint8Array(resultLen);

    for (let i = 0; i < resultLen; i++) {
      resultBytes[i] = this.api.load(remotePtr + i + 4);
    }

    this.api.deallocate(remotePtr, resultLen + 4);

    return resultBytes;
  }

  sendBytes(buffer: Uint8Array): i32 {
    let addr = this.api.allocate(buffer.byteLength);

    for (let i = 0; i < buffer.byteLength; i++) {
      let b: u8 = buffer[i];
      this.api.store(addr + i, b);
    }

    return addr;
  }

  invoke(buffer: Uint8Array): Uint8Array {
    let requestPtr = this.sendBytes(buffer);
    let resultPtr = this.api.invokeImpl(requestPtr, buffer.byteLength);
    return this.getBytes(resultPtr);
  }
}

export class StringInvoke {

  byteInvoker: ByteInvoke;

  constructor(api: API) {
    this.byteInvoker = new ByteInvoke(api);
  }

  invoke(request: string): string {
    let buffer = String.UTF8.encode(request);

    let resultBytes = this.byteInvoker.invoke(Uint8Array.wrap(buffer));

    return String.UTF8.decode(resultBytes.buffer);
  }
}
