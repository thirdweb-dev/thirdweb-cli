/**
 * Error that may get thrown if IPFS returns nothing for a given uri.
 * @internal
 */
export class NotFoundError extends Error {
  /** @internal */
  constructor(identifier?: string) {
    super(identifier ? `Object with id ${identifier} NOT FOUND` : "NOT_FOUND");
  }
}

/**
 * Error that may get thrown if an invalid address was passed
 * @internal
 */
export class InvalidAddressError extends Error {
  /** @internal */
  constructor(address?: string) {
    super(
      address ? `'${address}' is an invalid address` : "Invalid address passed",
    );
  }
}

/**
 * @internal
 */
export class MissingRoleError extends Error {
  /** @internal */
  /** @internal */
  constructor(address: string, role: string) {
    super(`MISSING ROLE: ${address} does not have the '${role}' role`);
  }
}

/**
 * @internal
 */
export class AssetNotFoundError extends Error {
  /** @internal */
  /** @internal */
  constructor(message = "The asset you're trying to use could not be found.") {
    super(`message: ${message}`);
  }
}

/**
 * @internal
 */
export class UploadError extends Error {
  /** @internal */
  constructor(message: string) {
    super(`UPLOAD_FAILED: ${message}`);
  }
}

/**
 * @internal
 */
export class FileNameMissingError extends Error {
  /** @internal */
  constructor() {
    super("File name is required when object is not a `File` type object.");
  }
}

/**
 * @internal
 */
export class DuplicateFileNameError extends Error {
  /** @internal */
  constructor(fileName: string) {
    super(
      `DUPLICATE_FILE_NAME_ERROR: File name ${fileName} was passed for more than one file.`,
    );
  }
}

/**
 * @internal
 */
export class NotEnoughTokensError extends Error {
  /** @internal */
  constructor(contractAddress: string, quantity: number, available: number) {
    super(
      `BALANCE ERROR: you do not have enough balance on contract ${contractAddress} to use ${quantity} tokens. You have ${available} tokens available.`,
    );
  }
}

/**
 * @internal
 */
export class MissingOwnerRoleError extends Error {
  /** @internal */
  constructor() {
    super(`LIST ERROR: you should be the owner of the token to list it.`);
  }
}

/**
 * @internal
 */
export class QuantityAboveLimitError extends Error {
  /** @internal */
  constructor(quantity: string) {
    super(`BUY ERROR: You cannot buy more than ${quantity} tokens`);
  }
}

/**
 * Thrown when data fails to fetch from storage.
 * @internal
 */
export class FetchError extends Error {
  public innerError?: Error;

  /** @internal */
  constructor(message: string, innerError?: Error) {
    super(`FETCH_FAILED: ${message}`);
    this.innerError = innerError;
  }
}

/**
 * Thrown when attempting to create a snapshot with duplicate leafs
 * @internal
 */
export class DuplicateLeafsError extends Error {
  constructor(message?: string) {
    super(`DUPLICATE_LEAFS${message ? ` : ${message}` : ""}`);
  }
}

/**
 * Thrown when attempting to update/cancel an auction that already started
 * @internal
 */
export class AuctionAlreadyStartedError extends Error {
  constructor(id?: string) {
    super(
      `Auction already started with existing bid${id ? `, id: ${id}` : ""}`,
    );
  }
}

/**
 * @internal
 */
export class FunctionDeprecatedError extends Error {
  /** @internal */
  constructor(message: string) {
    super(`FUNCTION DEPRECATED. ${message ? `Use ${message} instead` : ""}`);
  }
}
/**
 * Thrown when trying to retrieve a listing from a marketplace that doesn't exist
 * @internal
 */
export class ListingNotFoundError extends Error {
  constructor(marketplaceContractAddress: string, listingId?: string) {
    super(
      `Could not find listing.${
        marketplaceContractAddress
          ? ` marketplace address: ${marketplaceContractAddress}`
          : ""
      }${listingId ? ` listing id: ${listingId}` : ""}`,
    );
  }
}

/**
 * Thrown when trying to retrieve a listing of the wrong type
 * @internal
 */
export class WrongListingTypeError extends Error {
  constructor(
    marketplaceContractAddress: string,
    listingId?: string,
    actualType?: string,
    expectedType?: string,
  ) {
    super(
      `Incorrect listing type. Are you sure you're using the right method?.${
        marketplaceContractAddress
          ? ` marketplace address: ${marketplaceContractAddress}`
          : ""
      }${listingId ? ` listing id: ${listingId}` : ""}${
        expectedType ? ` expected type: ${expectedType}` : ""
      }${actualType ? ` actual type: ${actualType}` : ""}`,
    );
  }
}

/**
 * Thrown when attempting to transfer an asset that has restricted transferability
 * @internal
 */
export class RestrictedTransferError extends Error {
  constructor(assetAddress?: string) {
    super(
      `Failed to transfer asset, transfer is restricted.${
        assetAddress ? ` Address : ${assetAddress}` : ""
      }`,
    );
  }
}

/**
 * Thrown when attempting to execute an admin-role function.
 * @internal
 */
export class AdminRoleMissingError extends Error {
  constructor(
    address?: string,
    contractAddress?: string,
    message = "Failed to execute transaction",
  ) {
    super(
      `${message}, admin role is missing${
        address ? ` on address: ${address}` : ""
      }${contractAddress ? ` on contract: ${contractAddress}` : ""}`,
    );
  }
}
