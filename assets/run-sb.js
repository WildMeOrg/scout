/*
 * Actually run Simple boxes
 *
 *
 */


 $( document ).ready(function() {
   const init = async () => {

     try{
       await simpleBoxes.debug()
       let handle = await simpleBoxes.initHandle('imageToBox',['sfsdfd','dsfsdf']);

         let box1 = {
         id : 'sdfdsfdsfs',
         x : 50,
         y : 50,
         w : 100,
         h : 100,
         label : 'gerenuk'
       };

       let box2 = {
       id : 'tytrtytyrt',
       x : 300,
       y : 100,
       w : 50,
       h : 50,
       label : ''
     };

       simpleBoxes.loadBoxes(handle.id,[box1,box2])

     } catch(e){
       console.log("ERROR",e);
     }

     return;
   }
   init();
 });
