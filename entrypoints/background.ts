export default defineBackground(() => {
  // AutoDex currently handles form filling in the content script. Keeping an
  // explicit service worker gives Chrome a real background entry in every build.
});
