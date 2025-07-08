import jwt from "jsonwebtoken";

export const tokenFunction = ({
   payload = {} || '',
   signature = process.env.SIGNATURE,
   expiresIn = '1h',
   generate = true
}) =>
{
   if (!signature)
   {
      throw new Error('Signature is required');
   }
   if (typeof payload == "object")
   {
      if (Object.keys(payload).length)
      {
         //NOTE - Generate the Token
         if (generate && typeof payload == "object")
         {
            const token = jwt.sign(payload, signature, { expiresIn });
            return token;
         }
      }
      return false;
   }



   //====================================================
   //NOTE - Decode the Token

   if (typeof payload == "string")
   {
      if (payload == "")
      {
         return false;
      }
      if (generate == false && typeof payload == "string")
      {
         const decode = jwt.verify(payload, signature);
         return decode;
      }
   }
};

         















