1. Project Description: What your site does and who it is for
2. Database Schema: An image of your entity relation diagram (ERD) exported from pgAdmin showing your tables and relationships
3. User Roles: Explanation of each role and what they can do
Users: My project is a recipe site that allows users to document their own recipes and submit them to be reviewed so that they might appear on the 'Featured Recipes' page. Users will be able to create a copy of any featured recipe to their own collection and edit it how they like. Users can edit and delete their recipes in their personal collection. If a user gets one of their recipes on the featured page, they can delete it if wanted, but cannot edit it.

Contributors: Has the authorizations as users plus Contributors can see the submissions list and either accept or reject a given submitted recipe including recipes they made themselves. If the recipe is rejected, the owner of the recipe is notified and the recipe is removed from the submissions list. If a recipe is accepted, the owner is notified, it is removed from the submissions list, and moved to the 'Featured Recipe' page. Contributors will allowed to delete any recipe on the 'Featured Recipe' and moderate as needed. 

Admin: Has all the authorizations as users and contributors, as well as has a secret admin page that contains information on each user, namely their 'user_id', 'email', 'role', and 'created_at'. There will be a search bar on this page to look up specific emails. The admin can change the role of any user to be either, admin, contributor, or user.
4. Test Account Credentials: Username or email for one account of each role type, do not include the password in the README, but use P@$$w0rd! for all users

Admin:10toasterv2@gmail.com   Pass:Jayson098123
Con: scarlet.booth@gmail.com Pass: Jayson098123
User:booth22006@byui.edu Pass: Jayson098123
5. Known Limitations: Any features you did not complete or bugs you are aware of



Things I need to tackle:
user- button to submit a recipe to be featured
contributor- ability to approve or reject the submitted recipes (submitted, under review, approved/rejected)
admin- ^^ and ability to search the email of any user and change their role

Featured recipes should have an option to make a copy for yourself

Stretch:


Things to double check:
Protected routes that check authentication and authorization
Secure session configuration

9. Security and Validation
• SQL injection prevention through parameterized queries
• Input validation on all forms
• Sanitization of user inputs
• Secure session configuration
• Appropriate error messages (do not leak system details)