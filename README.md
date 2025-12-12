1. Project Description: What your site does and who it is for
2. Database Schema: An image of your entity relation diagram (ERD) exported from pgAdmin showing your tables and relationships
3. User Roles: Explanation of each role and what they can do
4. Test Account Credentials: Username or email for one account of each role type, do not include the password in the README, but use P@$$w0rd! for all users
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