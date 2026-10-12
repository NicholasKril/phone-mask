import { test, expect } from '@playwright/test';
import { build } from 'esbuild';

async function bundle(contents) {
  const result = await build({
    stdin: { contents, loader: 'jsx', resolveDir: process.cwd() },
    bundle: true, write: false, format: 'iife',
    define: { 'process.env.NODE_ENV': '"development"', __VUE_OPTIONS_API__: 'true', __VUE_PROD_DEVTOOLS__: 'false', __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false' },
  });
  return result.outputFiles[0].text;
}

test('React StrictMode keeps input and application state synchronized and cleans up', async ({ page }) => {
  await page.setContent('<div id="app"></div>');
  await page.addScriptTag({ content: await bundle(`
    import React, { useEffect, useRef, useState } from 'react';
    import { createRoot } from 'react-dom/client';
    import PhoneMask from 'phonemask';
    function Field() {
      const input = useRef(null);
      const [phone, setPhone] = useState('');
      useEffect(() => {
        window.savedInput = input.current;
        const mask = PhoneMask.attach(input.current, {
          defaultCountry: 'UA', hint: false,
          onChange: value => setPhone(value.international)
        });
        return () => mask.destroy();
      }, []);
      return <><input type="tel" ref={input}/><output>{phone}</output></>;
    }
    const root = createRoot(document.querySelector('#app'));
    root.render(<React.StrictMode><Field/></React.StrictMode>);
    window.unmount = () => root.unmount();
  `) });
  await page.locator('input').pressSequentially('0501234567');
  await expect(page.locator('input')).toHaveValue('050 123 4567');
  await expect(page.locator('output')).toHaveText('+380501234567');
  await page.evaluate(() => unmount());
  expect(await page.evaluate(() => savedInput.hasAttribute('data-country'))).toBe(false);
});

test('Vue mounted/unmounted integration updates reactive state', async ({ page }) => {
  await page.setContent('<div id="app"></div>');
  await page.addScriptTag({ content: await bundle(`
    import { createApp, ref, h, onMounted, onBeforeUnmount } from 'vue';
    import PhoneMask from 'phonemask';
    const app = createApp({ setup() {
      const input = ref(null);
      const phone = ref('');
      let mask;
      onMounted(() => {
        window.savedInput = input.value;
        mask = PhoneMask.attach(input.value, {
          defaultCountry: 'UA', hint: false,
          onChange: value => { phone.value = value.international; }
        });
      });
      onBeforeUnmount(() => mask.destroy());
      return () => h('div', [h('input', { type: 'tel', ref: input }), h('output', phone.value)]);
    }});
    app.mount('#app');
    window.unmount = () => app.unmount();
  `) });
  await page.locator('input').pressSequentially('0501234567');
  await expect(page.locator('input')).toHaveValue('050 123 4567');
  await expect(page.locator('output')).toHaveText('+380501234567');
  await page.evaluate(() => unmount());
  expect(await page.evaluate(() => savedInput.hasAttribute('data-country'))).toBe(false);
});
