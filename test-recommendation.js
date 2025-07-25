const { test, expect } = require('@playwright/test');

test('Test recommendation form as a user', async ({ page }) => {
  // Navigate to the local file
  await page.goto('file://' + __dirname + '/index.html');
  
  console.log('✅ Step 1: Successfully loaded the website');
  
  // Navigate to recommendation section
  await page.click('a[href="#recommendation"]');
  await page.waitForTimeout(1000);
  
  console.log('✅ Step 2: Navigated to Write Recommendation section');
  
  // Fill out the form fields
  await page.fill('#writerName', 'John Smith');
  await page.fill('#writerTitle', 'Camp Director');
  await page.fill('#writerEmail', 'john.smith@example.com');
  await page.fill('#organization', 'Summer Adventure Camp');
  
  console.log('✅ Step 3: Filled out contact information fields');
  
  // Check if the text is displaying correctly in the inputs
  const nameValue = await page.inputValue('#writerName');
  const titleValue = await page.inputValue('#writerTitle');
  const emailValue = await page.inputValue('#writerEmail');
  const orgValue = await page.inputValue('#organization');
  
  console.log('Input values:', { nameValue, titleValue, emailValue, orgValue });
  
  // Edit the letter content
  const letterTextarea = page.locator('#letterContent');
  await letterTextarea.click();
  await letterTextarea.selectAll();
  await letterTextarea.fill(`John Smith
Camp Director  
Summer Adventure Camp
July 25, 2025

Ellen MacGeorge
(410) 391-0196
Administration@bcsailing.org
PO Box 34134
2200 Rocky Point Road 
Baltimore, MD 21221

Dear Ellen MacGeorge,

I'm writing to recommend Silas Forrester for the Teen Counselor In Training (CIT) position at BCSC fishing camp. I had the pleasure of working with Silas during our summer program, where he demonstrated exceptional leadership and dedication.

Silas possesses a natural ability to connect with young campers and has shown genuine enthusiasm for outdoor activities, particularly fishing. His maturity and responsibility make him an ideal candidate for your program.

I recommend Silas without reservation and believe he would be a valuable addition to your team.

Sincerely,
John Smith
Camp Director
Summer Adventure Camp`);
  
  console.log('✅ Step 4: Edited the recommendation letter content');
  
  // Submit the form
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  
  console.log('✅ Step 5: Clicked Submit Recommendation button');
  
  // Check if success modal appeared
  const modal = page.locator('.fixed.inset-0');
  await expect(modal).toBeVisible();
  
  console.log('✅ Step 6: Success modal appeared');
  
  // Check if copy button exists
  const copyButton = page.locator('button:has-text("Copy Email Content")');
  await expect(copyButton).toBeVisible();
  
  console.log('✅ Step 7: Copy Email Content button is visible');
  
  // Check if Gmail button exists  
  const gmailButton = page.locator('button:has-text("Open Gmail")');
  await expect(gmailButton).toBeVisible();
  
  console.log('✅ Step 8: Open Gmail button is visible');
  
  // Test copy functionality (note: clipboard access may be limited in test)
  await copyButton.click();
  await page.waitForTimeout(1000);
  
  console.log('✅ Step 9: Clicked Copy Email Content button');
  
  console.log('\n=== TEST COMPLETE ===');
  console.log('The recommendation submission process works as expected!');
});